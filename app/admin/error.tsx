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
    <main className="p-8 max-w-xl mx-auto">
      <div className="border border-red-200 bg-red-50 rounded-xl p-6 flex flex-col gap-3">
        <p className="font-semibold text-red-800">Admin page error</p>
        <p className="text-sm text-red-700">
          Something went wrong. Check that you have admin access and try again.
        </p>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
          >
            Try again
          </button>
          <a href="/" className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            ← Home
          </a>
        </div>
      </div>
    </main>
  );
}
