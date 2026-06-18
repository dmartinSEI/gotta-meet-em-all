"use client";

import { useEffect } from "react";
import Image from "next/image";
import CatchButton from "./CatchButton";
import type { BountyRow } from "@/lib/bounty-client";
import { daysLeftInMonth } from "@/lib/bounty-client";

interface Props {
  bounty: BountyRow;
  onClose: () => void;
}

export default function BountyModal({ bounty, onClose }: Props) {
  const fullName = `${bounty.first_name} ${bounty.last_name}`;
  const daysLeft = daysLeftInMonth();
  const isComplete = bounty.completed_at !== null;

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full rounded-2xl overflow-hidden shadow-2xl"
        style={{ maxWidth: 380 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/15 transition-colors text-sm"
          aria-label="Close"
        >
          ✕
        </button>

        {/* ── Dark header ──────────────────────────────────────── */}
        <div
          className="relative overflow-hidden px-6 pt-6 pb-6"
          style={{ background: "linear-gradient(135deg, #2D1B4E 0%, #1a0e36 100%)" }}
        >
          {/* Circles decoration */}
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
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-[9px] font-black uppercase tracking-[0.18em] px-2.5 py-0.5 rounded-full"
                style={{
                  background: "rgba(200,16,46,0.25)",
                  color: "#fca5a5",
                  border: "1px solid rgba(200,16,46,0.35)",
                }}
              >
                Monthly Bounty
              </span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/55">
                +{bounty.bonus_xp} XP
              </span>
            </div>

            <h2 className="text-white font-black text-xl leading-tight mb-2.5">
              {isComplete ? `You met ${bounty.first_name}! 🎉` : `Your mission: Meet ${bounty.first_name}`}
            </h2>

            <p className="text-white/45 text-xs leading-relaxed">
              Each month you&apos;re paired with a colleague you haven&apos;t connected with yet.
              Reach out, grab time, and log the interaction before the month ends to earn your bonus.
            </p>
          </div>
        </div>

        {/* ── Light body ───────────────────────────────────────── */}
        <div className="bg-white px-6 py-5">

          {/* Consultant identity */}
          <div className="flex items-center gap-4 mb-4">
            <div
              className="relative w-16 h-16 rounded-full overflow-hidden shrink-0"
              style={{
                boxShadow: isComplete
                  ? "0 0 0 2px #22c55e, 0 0 0 5px rgba(34,197,94,0.15)"
                  : "0 0 0 2px #C8102E, 0 0 0 5px rgba(200,16,46,0.15)",
              }}
            >
              {bounty.photo_url ? (
                <Image
                  src={bounty.photo_url}
                  alt={fullName}
                  fill
                  sizes="64px"
                  className="object-cover object-top"
                />
              ) : (
                <div className="w-full h-full bg-[#2D1B4E] flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {bounty.first_name[0]}{bounty.last_name[0]}
                  </span>
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p className="font-bold text-[#2D1B4E] text-base leading-tight">{fullName}</p>
              {bounty.title && (
                <p className="text-xs text-[#2D1B4E]/55 mt-0.5 truncate">{bounty.title}</p>
              )}
              {bounty.office && (
                <p className="text-xs text-[#2D1B4E]/38 mt-0.5">{bounty.office}</p>
              )}
            </div>
          </div>

          {/* Status bar */}
          {isComplete ? (
            <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-green-50 border border-green-100">
              <span className="text-green-500 text-sm leading-none">✓</span>
              <p className="text-green-700 text-xs font-semibold">
                Bounty complete — +{bounty.bonus_xp} XP earned
              </p>
            </div>
          ) : (
            <div
              className="flex items-center justify-between mb-4 px-3 py-2 rounded-xl"
              style={{
                background: "rgba(200,16,46,0.05)",
                border: "1px solid rgba(200,16,46,0.12)",
              }}
            >
              <p className="text-[#C8102E] text-xs font-semibold">
                {daysLeft > 1
                  ? `${daysLeft} days left this month`
                  : daysLeft === 1
                  ? "Last day — don't miss out!"
                  : "Bounty expires today!"}
              </p>
              <span className="text-[#C8102E] font-black text-sm">+{bounty.bonus_xp} XP</span>
            </div>
          )}

          {/* Catch button — always shown so they can log the tier */}
          <CatchButton
            consultantId={bounty.consultant_id}
            initialLevel={null}
          />

          <p className="text-center text-[10px] text-[#2D1B4E]/25 mt-3">
            Press Esc or click outside to close
          </p>
        </div>
      </div>
    </div>
  );
}
