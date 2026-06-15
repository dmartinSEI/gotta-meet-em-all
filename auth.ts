import NextAuth from "next-auth";
import ResendProvider from "next-auth/providers/resend";
import PostgresAdapter from "@auth/pg-adapter";
import { Resend } from "resend";
import { pool } from "./lib/db";

const resend = new Resend(process.env.RESEND_API_KEY);

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PostgresAdapter(pool),
  secret: process.env.AUTH_SECRET,
  providers: [
    ResendProvider({
      apiKey: process.env.RESEND_API_KEY,
      from: "Gotta Meet Em All <onboarding@resend.dev>",
      sendVerificationRequest: async ({ identifier, url }) => {
        if (process.env.NODE_ENV === "development") {
          console.log(`\n======================================================`);
          console.log(`MAGIC LINK for ${identifier}`);
          console.log(url);
          console.log(`======================================================\n`);
        }

        await resend.emails.send({
          from: "Gotta Meet Em All <onboarding@resend.dev>",
          to: identifier,
          subject: "Your sign-in link",
          html: `
            <p>Click the link below to sign in to Gotta Meet Em All:</p>
            <a href="${url}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:white;border-radius:6px;text-decoration:none;font-weight:bold;">
              Sign In
            </a>
            <p style="color:#888;font-size:12px;margin-top:16px;">Link expires in 24 hours. If you did not request this, you can ignore it.</p>
          `,
        });
      },
    }),
  ],
});
