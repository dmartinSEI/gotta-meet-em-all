import NextAuth from "next-auth";
import ResendProvider from "next-auth/providers/resend";
import PostgresAdapter from "@auth/pg-adapter";
import { Resend } from "resend";
import { pool } from "./lib/db";

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
      sendVerificationRequest: async ({ identifier, url }) => {
        if (!isAllowedEmail(identifier)) {
          throw new Error("Sign-in is restricted to @sei.com email addresses.");
        }

        // Route through an intermediate confirmation page rather than the raw
        // callback URL. Corporate mail security gateways (Barracuda, Defender
        // Safe Links, etc.) pre-fetch links in emails to scan them, which
        // consumes single-use magic-link tokens before the real user clicks.
        // The confirmation page is harmless to pre-fetch; only a human
        // clicking the button there hits the real token-consuming callback.
        const confirmUrl = `${new URL(url).origin}/auth/verify?url=${encodeURIComponent(url)}`;

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
