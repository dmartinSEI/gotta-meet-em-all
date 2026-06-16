import SignInButton from "./SignInButton";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ ticket?: string }>;
}) {
  const { ticket } = await searchParams;

  if (!ticket) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold">Gotta Meet Em All</h1>
        <p className="text-sm text-gray-500">This sign-in link is invalid or incomplete.</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">Gotta Meet Em All</h1>
      <p className="text-sm text-gray-500 max-w-sm">
        Click below to finish signing in. This extra step prevents email security scanners from
        using up your one-time sign-in link before you do.
      </p>
      <SignInButton ticket={ticket} />
    </main>
  );
}
