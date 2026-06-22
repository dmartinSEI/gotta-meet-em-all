import AnimatedAuthBackground from "../../AnimatedAuthBackground";
import SignInButton from "./SignInButton";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ ticket?: string }>;
}) {
  const { ticket } = await searchParams;

  if (!ticket) {
    return (
      <AnimatedAuthBackground>
        <img src="/brand/sei-logoblack-002.svg" alt="SEI" style={{ height: 44 }} className="mb-7" />
        <div
          className="flex items-center justify-center rounded-full mb-5"
          style={{ width: 64, height: 64, background: "rgba(200,16,46,0.12)", border: "1.5px solid rgba(200,16,46,0.28)" }}
        >
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#C8102E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <h1 className="text-white font-black text-3xl tracking-tight mb-2">Invalid link</h1>
        <p className="text-white/45 text-sm mb-8 max-w-xs">
          This sign-in link is missing or incomplete.
        </p>
        <a href="/auth/signin" className="px-6 py-2.5 bg-[#C8102E] hover:bg-[#a50d25] text-white rounded-xl text-sm font-bold transition-colors">
          Back to sign in
        </a>
      </AnimatedAuthBackground>
    );
  }

  return (
    <AnimatedAuthBackground>
      <img src="/brand/sei-logoblack-002.svg" alt="SEI" style={{ height: 44 }} className="mb-7" />
      <h1 className="text-white font-black text-3xl tracking-tight mb-2">Almost there</h1>
      <p className="text-white/45 text-sm mb-8 max-w-xs leading-relaxed">
        Click below to finish signing in. This extra step stops email security
        scanners from consuming your one-time link.
      </p>
      <SignInButton ticket={ticket} />
    </AnimatedAuthBackground>
  );
}
