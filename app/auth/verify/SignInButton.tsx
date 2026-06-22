"use client";

import { useState } from "react";
import { resolveTicket } from "./actions";

export default function SignInButton({ ticket }: { ticket: string }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const { url } = await resolveTicket(ticket);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full px-6 py-3 bg-[#C8102E] hover:bg-[#a50d25] text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
      >
        {loading ? "Signing in…" : "Complete sign in →"}
      </button>
      {error && (
        <div
          className="w-full px-4 py-3 rounded-xl text-sm text-center"
          style={{ background: "rgba(200,16,46,0.12)", border: "1px solid rgba(200,16,46,0.30)", color: "rgba(255,255,255,0.80)" }}
        >
          {error}{" "}
          <a href="/auth/signin" className="underline text-white/60 hover:text-white transition-colors">
            Request a new link
          </a>
        </div>
      )}
    </div>
  );
}
