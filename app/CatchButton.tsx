"use client";

import { useEffect, useRef, useState } from "react";
import { catchConsultant, upgradeConsultant, uncatchConsultant } from "./actions";
import type { BadgeInfo } from "@/lib/types";
import { CATCH_LEVEL_LABELS, CATCH_LEVEL_ICONS, CATCH_LEVEL_DESC, XP_PER_LEVEL } from "@/lib/xp";

type Level = 1 | 2 | 3;
const ALL_LEVELS: Level[] = [1, 2, 3];

const LEVEL_COLORS: Record<Level, { bg: string; text: string; border: string }> = {
  1: { bg: "#f0f9ff", text: "#0369a1", border: "#bae6fd" },
  2: { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  3: { bg: "#faf5ff", text: "#7e22ce", border: "#e9d5ff" },
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
  const [level, setLevel]               = useState<Level | null>(initialLevel);
  const [loadingLevel, setLoadingLevel] = useState<Level | null>(null);
  const [removing, setRemoving]         = useState(false);
  const [confirming, setConfirming]     = useState(false);
  const [upgradeOpen, setUpgradeOpen]   = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const isLoading = loadingLevel !== null || removing;

  async function handleCatch(targetLevel: Level) {
    setLoadingLevel(targetLevel);
    const result = await catchConsultant(consultantId, targetLevel);
    if (result.success) {
      setLevel(targetLevel);
      setUpgradeOpen(false);
      fireBadgeEvent(result.newBadges);
    }
    setLoadingLevel(null);
  }

  async function handleUpgrade(targetLevel: Level) {
    setLoadingLevel(targetLevel);
    const result = await upgradeConsultant(consultantId, targetLevel as 2 | 3);
    if (result.success) {
      setLevel(targetLevel);
      setUpgradeOpen(false);
      fireBadgeEvent(result.newBadges);
    }
    setLoadingLevel(null);
  }

  async function handleUnmeet() {
    setRemoving(true);
    const result = await uncatchConsultant(consultantId);
    if (result.success) { setLevel(null); setUpgradeOpen(false); }
    else setConfirming(false);
    setRemoving(false);
  }

  // ── Uncaught: 3 compact horizontal options ────────────────────────────
  if (level === null) {
    return (
      <div className="flex gap-1.5">
        {ALL_LEVELS.map((lvl) => {
          const c = LEVEL_COLORS[lvl];
          return (
            <button
              key={lvl}
              onClick={() => handleCatch(lvl)}
              disabled={isLoading}
              title={CATCH_LEVEL_DESC[lvl]}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg border transition-colors disabled:opacity-50"
              style={{ background: c.bg, color: c.text, borderColor: c.border, fontSize: 10 }}
            >
              <span style={{ fontSize: 15, lineHeight: 1 }}>
                {loadingLevel === lvl ? "…" : CATCH_LEVEL_ICONS[lvl]}
              </span>
              <span className="font-semibold leading-none">{CATCH_LEVEL_LABELS[lvl]}</span>
              <span style={{ color: "inherit", opacity: 0.6 }}>+{XP_PER_LEVEL[lvl]} XP</span>
            </button>
          );
        })}
      </div>
    );
  }

  // ── Caught: current level + collapsed upgrade toggle ─────────────────
  const upgrades = ALL_LEVELS.filter((lvl) => lvl > level);
  const c = LEVEL_COLORS[level];

  return (
    <div className="flex flex-col gap-1.5">

      {/* Current level + upgrade toggle on the same row */}
      <div className="flex items-center gap-1.5">
        <div
          className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold"
          style={{ background: c.bg, color: c.text, borderColor: c.border }}
        >
          <span style={{ fontSize: 14, lineHeight: 1 }}>{CATCH_LEVEL_ICONS[level]}</span>
          <span>{CATCH_LEVEL_LABELS[level]}</span>
          <span style={{ opacity: 0.5, marginLeft: "auto", fontSize: 10 }}>✓</span>
        </div>

        {upgrades.length > 0 && (
          <button
            onClick={() => setUpgradeOpen((o) => !o)}
            disabled={isLoading}
            title="Upgrade connection level"
            className="flex items-center justify-center w-8 h-8 rounded-lg border transition-colors disabled:opacity-50 shrink-0"
            style={{
              background: upgradeOpen ? "#2D1B4E" : "#fff",
              color:      upgradeOpen ? "#fff"    : "rgba(45,27,78,0.50)",
              borderColor: upgradeOpen ? "#2D1B4E" : "rgba(45,27,78,0.14)",
            }}
          >
            <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={upgradeOpen ? "M2 8l4-4 4 4" : "M2 4l4 4 4-4"} />
            </svg>
          </button>
        )}
      </div>

      {/* Upgrade options — shown only when toggle is open */}
      {upgradeOpen && upgrades.map((lvl) => {
        const uc = LEVEL_COLORS[lvl];
        return (
          <button
            key={lvl}
            onClick={() => handleUpgrade(lvl)}
            disabled={isLoading}
            title={CATCH_LEVEL_DESC[lvl]}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors disabled:opacity-50"
            style={{ background: uc.bg, color: uc.text, borderColor: uc.border }}
          >
            <span style={{ fontSize: 13, lineHeight: 1 }}>
              {loadingLevel === lvl ? "…" : CATCH_LEVEL_ICONS[lvl]}
            </span>
            <span>{CATCH_LEVEL_LABELS[lvl]}</span>
            <span style={{ marginLeft: "auto", opacity: 0.6 }}>+{XP_PER_LEVEL[lvl] - XP_PER_LEVEL[level]} XP</span>
          </button>
        );
      })}

      {/* Undo — very subtle, text only */}
      {confirming ? (
        <div className="flex gap-1">
          <button
            onClick={handleUnmeet}
            disabled={isLoading}
            className="flex-1 py-1 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50"
            style={{ background: "#fff1f2", color: "#be123c", borderColor: "#fecdd3" }}
          >
            {removing ? "…" : "Confirm remove"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="py-1 px-3 rounded-lg text-xs border transition-colors"
            style={{ background: "#fff", color: "rgba(45,27,78,0.40)", borderColor: "rgba(45,27,78,0.10)" }}
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
          className="text-[10px] text-right transition-colors"
          style={{ color: "rgba(45,27,78,0.22)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(45,27,78,0.45)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(45,27,78,0.22)")}
        >
          undo
        </button>
      )}
    </div>
  );
}
