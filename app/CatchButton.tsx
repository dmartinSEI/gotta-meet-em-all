"use client";

import { useEffect, useRef, useState } from "react";
import { catchConsultant, upgradeConsultant, uncatchConsultant } from "./actions";
import type { BadgeInfo } from "@/lib/types";
import { CATCH_LEVEL_LABELS, CATCH_LEVEL_ICONS, CATCH_LEVEL_DESC, XP_PER_LEVEL } from "@/lib/xp";

type Level = 1 | 2 | 3;
const ALL_LEVELS: Level[] = [1, 2, 3];

const LEVEL_STYLES: Record<Level, string> = {
  1: "bg-sky-50 text-sky-700 border-sky-200",
  2: "bg-green-50 text-green-700 border-green-200",
  3: "bg-purple-50 text-purple-700 border-purple-200",
};

const LEVEL_HOVER: Record<Level, string> = {
  1: "hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300",
  2: "hover:bg-green-50 hover:text-green-700 hover:border-green-300",
  3: "hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300",
};

function fireBadgeEvent(badges: BadgeInfo[]) {
  if (badges.length > 0 && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("badge-earned", { detail: badges }));
  }
}

export default function CatchButton({
  consultantId,
  initialLevel = null,
}: {
  consultantId: number;
  initialLevel?: Level | null;
}) {
  const [level, setLevel] = useState<Level | null>(initialLevel);
  const [loadingLevel, setLoadingLevel] = useState<Level | null>(null);
  const [removing, setRemoving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const isLoading = loadingLevel !== null || removing;

  async function handleCatch(targetLevel: Level) {
    setLoadingLevel(targetLevel);
    const result = await catchConsultant(consultantId, targetLevel);
    if (result.success) {
      setLevel(targetLevel);
      fireBadgeEvent(result.newBadges);
    }
    setLoadingLevel(null);
  }

  async function handleUpgrade(targetLevel: Level) {
    setLoadingLevel(targetLevel);
    const result = await upgradeConsultant(consultantId, targetLevel as 2 | 3);
    if (result.success) {
      setLevel(targetLevel);
      fireBadgeEvent(result.newBadges);
    }
    setLoadingLevel(null);
  }

  async function handleUnmeet() {
    setRemoving(true);
    const result = await uncatchConsultant(consultantId);
    if (result.success) setLevel(null);
    else setConfirming(false);
    setRemoving(false);
  }

  // ── Uncaught: show all 3 options up front ──────────────────────────────
  if (level === null) {
    return (
      <div className="flex flex-col gap-1">
        {ALL_LEVELS.map((lvl) => (
          <div key={lvl} className="relative group">
            <div className="absolute bottom-full left-0 right-0 mb-1.5 px-2 py-1 bg-gray-900 text-white text-[10px] leading-snug rounded-md text-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-10">
              {CATCH_LEVEL_DESC[lvl]}
            </div>
            <button
              onClick={() => handleCatch(lvl)}
              disabled={isLoading}
              className={`w-full py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 bg-white text-gray-500 border-gray-200 ${LEVEL_HOVER[lvl]}`}
            >
              {loadingLevel === lvl
                ? "…"
                : `${CATCH_LEVEL_ICONS[lvl]} ${CATCH_LEVEL_LABELS[lvl]}  ·  +${XP_PER_LEVEL[lvl]} XP`}
            </button>
          </div>
        ))}
      </div>
    );
  }

  // ── Caught: show current tier + upgrades above it + undo ───────────────
  const upgrades = ALL_LEVELS.filter((lvl) => lvl > level);

  return (
    <div className="flex flex-col gap-1.5">
      {/* Current tier badge */}
      <div className={`w-full py-1.5 rounded-lg text-xs font-semibold border text-center ${LEVEL_STYLES[level]}`}>
        {CATCH_LEVEL_ICONS[level]} {CATCH_LEVEL_LABELS[level]} ✓
      </div>

      {/* Upgrade options for tiers above current */}
      {upgrades.map((lvl) => (
        <div key={lvl} className="relative group">
          <div className="absolute bottom-full left-0 right-0 mb-1.5 px-2 py-1 bg-gray-900 text-white text-[10px] leading-snug rounded-md text-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-10">
            {CATCH_LEVEL_DESC[lvl]}
          </div>
          <button
            onClick={() => handleUpgrade(lvl)}
            disabled={isLoading}
            className={`w-full py-1 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 bg-white text-gray-500 border-gray-200 ${LEVEL_HOVER[lvl]}`}
          >
            {loadingLevel === lvl
              ? "…"
              : `↑ ${CATCH_LEVEL_ICONS[lvl]} ${CATCH_LEVEL_LABELS[lvl]}`}
          </button>
        </div>
      ))}

      {/* Undo with confirmation */}
      {confirming ? (
        <div className="flex gap-1">
          <button
            onClick={handleUnmeet}
            disabled={isLoading}
            className="flex-1 py-1 rounded-lg text-xs font-medium border bg-red-50 text-red-600 border-red-200 hover:bg-red-100 disabled:opacity-50"
          >
            {removing ? "…" : "Remove"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="flex-1 py-1 rounded-lg text-xs font-medium border bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            setConfirming(true);
            timer.current = setTimeout(() => setConfirming(false), 3000);
          }}
          className="w-full py-1 rounded-lg text-xs font-medium border bg-white text-gray-300 border-gray-100 hover:text-gray-400"
        >
          Undo
        </button>
      )}
    </div>
  );
}
