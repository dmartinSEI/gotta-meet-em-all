import NextAuth from "next-auth";
import ResendProvider from "next-auth/providers/resend";
import PostgresAdapter from "@auth/pg-adapter";
import { Resend } from "resend";
import { randomBytes } from "crypto";
import { pool, sql } from "./lib/db";

const resend = new Resend(process.env.RESEND_API_KEY);

const ALLOWED_DOMAINS = ["@sei.com", "@gottameetemall.com"];

function isAllowedEmail(email: string) {
  const lower = email.toLowerCase();
  return ALLOWED_DOMAINS.some((domain) => lower.endsWith(domain));
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PostgresAdapter(pool),
  secret: process.env.AUTH_SECRET,
  pages: {
    error: "/auth/error",
  },
  providers: [
    ResendProvider({
      apiKey: process.env.RESEND_API_KEY,
      from: "Gotta Meet Em All <noreply@gottameetemall.com>",
      sendVerificationRequest: async ({ identifier, url, request }) => {
        if (!isAllowedEmail(identifier)) {
          throw new Error("Sign-in is restricted to @sei.com email addresses.");
        }

        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

        // Opportunistic cleanup: drop expired tickets and old attempt records
        // since there's no cron job. Cheap relative to the email send itself.
        await sql`DELETE FROM link_tickets WHERE created_at < now() - interval '1 hour'`;
        await sql`DELETE FROM sign_in_attempts WHERE created_at < now() - interval '1 day'`;

        // Rate limit to stop sign-in spam: email-bombing a coworker's inbox
        // with repeated magic links, or burning the Resend send quota.
        const { rows: byEmail } = await sql<{ count: string }>`
          SELECT count(*) FROM sign_in_attempts
          WHERE identifier = ${identifier} AND created_at > now() - interval '15 minutes'
        `;
        if (Number(byEmail[0].count) >= 3) {
          throw new Error("Too many sign-in requests for this email. Please wait a few minutes and try again.");
        }
        const { rows: byIp } = await sql<{ count: string }>`
          SELECT count(*) FROM sign_in_attempts
          WHERE ip = ${ip} AND created_at > now() - interval '15 minutes'
        `;
        if (Number(byIp[0].count) >= 10) {
          throw new Error("Too many sign-in requests from this network. Please wait a few minutes and try again.");
        }
        await sql`INSERT INTO sign_in_attempts (identifier, ip) VALUES (${identifier}, ${ip})`;

        // Corporate mail security gateways (Barracuda, Defender Safe Links,
        // etc.) fetch and crawl links in emails to scan them, which can
        // consume single-use magic-link tokens before the real user clicks.
        // The email never contains the real token: it links to an opaque
        // ticket that's only resolved to the real URL via a POST action
        // triggered by an actual button click, never via a fetchable GET URL.
        const ticket = randomBytes(24).toString("hex");
        await sql`INSERT INTO link_tickets (ticket, url) VALUES (${ticket}, ${url})`;
        const confirmUrl = `${new URL(url).origin}/auth/verify?ticket=${ticket}`;

        if (process.env.NODE_ENV === "development") {
          console.log(`\n======================================================`);
          console.log(`MAGIC LINK for ${identifier}`);
          console.log(confirmUrl);
          console.log(`======================================================\n`);
        }

        await resend.emails.send({
          from: "Gotta Meet Em All <noreply@gottameetemall.com>",
          to: identifier,
          subject: "Your sign-in link",
          html: `
            <p>Click the link below to sign in to Gotta Meet Em All:</p>
            <a href="${confirmUrl}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:white;border-radius:6px;text-decoration:none;font-weight:bold;">
              Sign In
            </a>
            <p style="color:#888;font-size:12px;margin-top:16px;">Link expires in 24 hours. If you did not request this, you can ignore it.</p>
          `,
        });
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      return !!user.email && isAllowedEmail(user.email);
    },
  },
});
