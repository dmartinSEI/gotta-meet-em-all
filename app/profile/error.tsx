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
    <main className="p-8 max-w-2xl mx-auto">
      <a href="/" className="text-sm text-gray-400 hover:text-gray-600 block mb-8">
        ← Back
      </a>
      <div className="border border-red-200 bg-red-50 rounded-xl p-6 flex flex-col gap-3">
        <p className="font-semibold text-red-800">Failed to load profile</p>
        <p className="text-sm text-red-700">
          An error occurred while loading your profile. Please try again.
        </p>
        <button
          onClick={reset}
          className="self-start px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
