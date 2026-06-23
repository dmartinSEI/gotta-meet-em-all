import { signIn } from "../../../auth";
import AnimatedAuthBackground from "../../AnimatedAuthBackground";

export default function SignInPage() {
  return (
    <AnimatedAuthBackground>
      <h1 className="text-white font-black text-4xl tracking-tight mb-2">SEI Gotta Meet Em&apos; All</h1>
      <p className="text-white/40 text-sm mb-8">Enter your SEI email to receive a sign-in link.</p>

      <form
        action={async (formData: FormData) => {
          "use server";
          await signIn("resend", {
            email: formData.get("email") as string,
            redirectTo: "/",
          });
        }}
        className="flex flex-col gap-3 w-full"
      >
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@sei.com"
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1.5px solid rgba(255,255,255,0.14)",
            color: "#fff",
          }}
        />
        <button
          type="submit"
          className="w-full px-6 py-3 rounded-xl font-bold text-sm text-white bg-[#C8102E] hover:bg-[#a50d25] transition-colors"
        >
          Send sign-in link →
        </button>
      </form>

      <p className="mt-8 text-white/20 text-xs">
        Sign-in is restricted to @sei.com email addresses.
      </p>
    </AnimatedAuthBackground>
  );
}
