import AnimatedAuthBackground from "../../AnimatedAuthBackground";

const RESTRICTED_ERRORS = new Set(["AccessDenied"]);

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const isRestricted = error ? RESTRICTED_ERRORS.has(error) : false;

  return (
    <AnimatedAuthBackground>
      <div
        className="flex items-center justify-center rounded-full mb-6"
        style={{
          width: 64, height: 64,
          background: "rgba(200,16,46,0.12)",
          border: "1.5px solid rgba(200,16,46,0.28)",
        }}
      >
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none"
             stroke="#C8102E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      </div>

      <h1 className="text-white font-black text-3xl tracking-tight mb-2">
        {isRestricted ? "Access restricted" : "Sign-in failed"}
      </h1>
      <p className="text-white/45 text-sm max-w-xs leading-relaxed mb-8">
        {isRestricted
          ? "This app is for SEI employees only. Please sign in with your @sei.com email address."
          : "Something went wrong while signing you in. Please try again."}
      </p>

      <a
        href="/auth/signin"
        className="px-7 py-3 bg-[#C8102E] hover:bg-[#a50d25] text-white rounded-xl font-bold text-sm transition-colors"
      >
        Try again
      </a>
    </AnimatedAuthBackground>
  );
}
