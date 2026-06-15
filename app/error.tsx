"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
      <h2 className="text-xl font-semibold text-gray-800">Something went wrong</h2>
      <p className="text-sm text-gray-500 max-w-sm text-center">
        An unexpected error occurred. Try again or contact an admin if the problem persists.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Try again
        </button>
        <a href="/" className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          ← Home
        </a>
      </div>
    </main>
  );
}
