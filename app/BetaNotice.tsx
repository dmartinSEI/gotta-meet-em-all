"use client";

import { useCallback, useEffect, useState } from "react";

// Bump this when a new notice should be shown to everyone again (e.g. "v2").
const NOTICE_KEY = "gmea-beta-notice-v1-dismissed";

export default function BetaNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(NOTICE_KEY)) setOpen(true);
    } catch {
      setOpen(true); // storage blocked (private window etc.): still show the notice
    }
  }, []);

  const dismiss = useCallback(() => {
    try { localStorage.setItem(NOTICE_KEY, new Date().toISOString()); } catch {}
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") dismiss(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dismiss]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
      aria-labelledby="beta-notice-title"
    >
      <div
        className="relative w-full rounded-2xl overflow-hidden shadow-2xl"
        style={{ maxWidth: 400 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Dark header ──────────────────────────────────────── */}
        <div
          className="relative overflow-hidden px-6 pt-6 pb-6"
          style={{ background: "linear-gradient(135deg, #2D1B4E 0%, #1a0e36 100%)" }}
        >
          <svg
            className="absolute right-0 top-0 h-full w-44 opacity-[0.12]"
            viewBox="0 0 176 110"
            preserveAspectRatio="xMaxYMid meet"
            aria-hidden
          >
            {[28, 52, 76, 100, 124, 148, 172].map((r) => (
              <circle key={r} cx="176" cy="55" r={r} fill="none" stroke="#C8102E" strokeWidth="1" />
            ))}
          </svg>

          <div className="relative">
            <span
              className="inline-block text-[9px] font-black uppercase tracking-[0.18em] px-2.5 py-0.5 rounded-full mb-3"
              style={{
                background: "rgba(200,16,46,0.25)",
                color: "#fca5a5",
                border: "1px solid rgba(200,16,46,0.35)",
              }}
            >
              Version 1 · Beta
            </span>

            <h2 id="beta-notice-title" className="text-white font-black text-xl leading-tight mb-2.5">
              Welcome to the beta!
            </h2>

            <p className="text-white/55 text-xs leading-relaxed">
              You&apos;re using an early version of Gotta Meet Em&apos; All. We&apos;re testing it
              with a small group before a wider SEI launch, so expect a few rough edges.
            </p>
          </div>
        </div>

        {/* ── Light body ───────────────────────────────────────── */}
        <div className="bg-white px-6 py-5">
          <div
            className="flex gap-3 mb-5 px-3.5 py-3 rounded-xl"
            style={{
              background: "rgba(200,16,46,0.05)",
              border: "1px solid rgba(200,16,46,0.12)",
            }}
          >
            <span className="text-base leading-none mt-0.5" aria-hidden>⚠️</span>
            <p className="text-xs leading-relaxed text-[#2D1B4E]">
              <span className="font-bold">Data will be reset</span> before the larger release.
              Play, explore and try things out. Your progress here is for testing.
            </p>
          </div>

          <button
            onClick={dismiss}
            autoFocus
            className="w-full py-2.5 bg-[#C8102E] text-white rounded-xl text-sm font-bold hover:bg-[#a50d25] transition-colors"
          >
            Got it, let&apos;s play
          </button>
        </div>
      </div>
    </div>
  );
}
