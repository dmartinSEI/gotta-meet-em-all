"use client";

import { useState } from "react";
import Image from "next/image";
import type { BountyRow } from "@/lib/bounty-client";
import { daysLeftInMonth } from "@/lib/bounty-client";
import BountyModal from "./BountyModal";

interface Props {
  bounty: BountyRow;
}

export default function BountyCard({ bounty }: Props) {
  const [open, setOpen] = useState(false);
  const daysLeft = daysLeftInMonth();
  const fullName = `${bounty.first_name} ${bounty.last_name}`;
  const isComplete = bounty.completed_at !== null;

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="relative overflow-hidden rounded-2xl mb-8 flex gap-5 items-center cursor-pointer select-none
          transition-all duration-200 hover:scale-[1.01] hover:shadow-xl"
        style={{
          background: isComplete
            ? "linear-gradient(135deg, #14532d 0%, #0f3d21 100%)"
            : "linear-gradient(135deg, #2D1B4E 0%, #1a0e36 100%)",
          padding: "20px 24px",
        }}
      >
        {/* Left accent bar */}
        <div
          className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full"
          style={{ background: isComplete ? "#22c55e" : "#C8102E" }}
        />

        {/* Decorative circles */}
        <svg
          className="absolute right-0 top-0 h-full w-48 opacity-[0.08]"
          viewBox="0 0 192 80"
          preserveAspectRatio="xMaxYMid meet"
          aria-hidden
        >
          {[30, 55, 80, 105, 130, 155].map((r) => (
            <circle
              key={r} cx="192" cy="40" r={r} fill="none"
              stroke={isComplete ? "#22c55e" : "#C8102E"} strokeWidth="1"
            />
          ))}
        </svg>

        {/* Photo / avatar */}
        <div
          className="relative w-14 h-14 rounded-full overflow-hidden shrink-0"
          style={{
            boxShadow: isComplete
              ? "0 0 0 2px #22c55e, 0 0 0 4px rgba(34,197,94,0.2)"
              : "0 0 0 2px #C8102E, 0 0 0 4px rgba(200,16,46,0.2)",
          }}
        >
          {isComplete ? (
            bounty.photo_url ? (
              <Image src={bounty.photo_url} alt={fullName} fill sizes="56px" className="object-cover object-top" />
            ) : (
              <InitialsAvatar name={fullName} />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/10">
              <span className="text-white/40 text-2xl font-black">?</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="relative flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[9px] font-black uppercase tracking-[0.18em] px-2.5 py-0.5 rounded-full"
              style={{
                background: isComplete ? "rgba(34,197,94,0.2)" : "rgba(200,16,46,0.25)",
                color: isComplete ? "#86efac" : "#fca5a5",
                border: `1px solid ${isComplete ? "rgba(34,197,94,0.3)" : "rgba(200,16,46,0.3)"}`,
              }}
            >
              Monthly Bounty
            </span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/60">
              +{bounty.bonus_xp} XP
            </span>
          </div>

          {isComplete ? (
            <>
              <p className="font-bold text-white leading-tight">{fullName}</p>
              {bounty.office && <p className="text-xs text-white/50 mt-0.5">{bounty.office}</p>}
              <p className="text-xs text-green-400 font-semibold mt-1">
                ✓ Bounty complete — +{bounty.bonus_xp} XP earned
              </p>
            </>
          ) : (
            <>
              <p className="font-bold text-white leading-tight">Meet {fullName}</p>
              {bounty.office && <p className="text-xs text-white/50 mt-0.5">{bounty.office}</p>}
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                {daysLeft > 1
                  ? `${daysLeft} days left this month`
                  : daysLeft === 1
                  ? "Last day — don't miss out!"
                  : "Bounty expires today!"}
              </p>
            </>
          )}
        </div>

        {/* Tap hint */}
        <div className="relative shrink-0 text-white/20 text-xs font-medium">
          Tap to open →
        </div>
      </div>

      {open && <BountyModal bounty={bounty} onClose={() => setOpen(false)} />}
    </>
  );
}

const AVATAR_COLORS = [
  "bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-orange-500",
  "bg-pink-500", "bg-teal-500", "bg-indigo-500", "bg-rose-500",
];

function InitialsAvatar({ name }: { name: string }) {
  const initials = name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div className={`w-full h-full flex items-center justify-center text-white font-bold text-xl ${color}`}>
      {initials}
    </div>
  );
}
