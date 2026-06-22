import AnimatedAuthBackground from "../../AnimatedAuthBackground";

export default function CheckEmailPage() {
  return (
    <AnimatedAuthBackground>
      {/* Envelope icon */}
      <div
        className="flex items-center justify-center rounded-full mb-7"
        style={{
          width: 72, height: 72,
          background: "rgba(200,16,46,0.12)",
          border: "1.5px solid rgba(200,16,46,0.28)",
        }}
      >
        <svg viewBox="0 0 24 24" width="30" height="30" fill="none"
             stroke="#C8102E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M2 7l10 7 10-7" />
        </svg>
      </div>

      <h1 className="text-white font-black text-4xl tracking-tight mb-3">Check your email</h1>
      <p className="text-white/50 text-sm leading-relaxed mb-2 max-w-xs">
        A sign-in link is on its way to your inbox. Click the button in the email to continue.
      </p>
      <p className="text-white/25 text-xs leading-relaxed mb-10 max-w-xs">
        If you don&apos;t see it within a minute, check your spam or junk folder.
      </p>

      <a
        href="/auth/signin"
        className="text-xs text-white/30 hover:text-white/60 transition-colors"
      >
        ← Back to sign in
      </a>
    </AnimatedAuthBackground>
  );
}
