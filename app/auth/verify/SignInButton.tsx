"use client";

export default function SignInButton({ url }: { url: string }) {
  return (
    <button
      onClick={() => {
        window.location.href = url;
      }}
      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
    >
      Sign In
    </button>
  );
}
