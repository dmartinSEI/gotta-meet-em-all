const RESTRICTED_ERRORS = new Set(["AccessDenied", "EmailSignin", "Configuration"]);

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const isRestricted = error ? RESTRICTED_ERRORS.has(error) : false;

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">Gotta Meet Em All</h1>

      {isRestricted ? (
        <>
          <p className="text-lg font-semibold text-gray-800">This app is for SEI employees only</p>
          <p className="text-sm text-gray-500 max-w-sm">
            Sign-in is restricted to @sei.com email addresses. Please try again with your SEI email.
          </p>
        </>
      ) : (
        <>
          <p className="text-lg font-semibold text-gray-800">Sign-in failed</p>
          <p className="text-sm text-gray-500 max-w-sm">
            Something went wrong while signing you in. Please try again.
          </p>
        </>
      )}

      <a
        href="/api/auth/signin"
        className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
      >
        Try Again
      </a>
    </main>
  );
}
