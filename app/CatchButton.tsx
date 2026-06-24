"use client";

import { useEffect, useRef, useState } from "react";
import { catchConsultant, upgradeConsultant, uncatchConsultant } from "./actions";
import type { BadgeInfo } from "@/lib/types";
import { CATCH_LEVEL_LABELS, CATCH_LEVEL_ICONS, CATCH_LEVEL_DESC, XP_PER_LEVEL } from "@/lib/xp";

type Level = 1 | 2 | 3;
const ALL_LEVELS: Level[] = [1, 2, 3];

const LEVEL_COLORS: Record<Level, { bg: string; text: string; border: string; pill: string }> = {
  1: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe", pill: "#dbeafe" },
  2: { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0", pill: "#dcfce7" },
  3: { bg: "#faf5ff", text: "#7e22ce", border: "#e9d5ff", pill: "#ede9fe" },
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
    if (result.success) { setLevel(null); }
    else setConfirming(false);
    setRemoving(false);
  }

  // ── Uncaught: 3 tiles side-by-side ────────────────────────────────────
  if (level === null) {
    return (
      <div>
        <p style={{
          fontSize: 9, fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.12em", color: "rgba(45,27,78,0.38)",
          marginBottom: 7,
        }}>
          How well have you met?
        </p>
        <div style={{ display: "flex", gap: 7 }}>
          {ALL_LEVELS.map((lvl) => {
            const c = LEVEL_COLORS[lvl];
            const loading = loadingLevel === lvl;
            return (
              <button
                key={lvl}
                onClick={() => handleCatch(lvl)}
                disabled={isLoading}
                title={CATCH_LEVEL_DESC[lvl]}
                className="flex-1 flex flex-col items-center rounded-xl border-[1.5px] transition-all disabled:opacity-50 hover:brightness-[0.96] active:scale-[0.97]"
                style={{
                  background: c.bg, borderColor: c.border,
                  padding: "11px 6px 10px",
                  gap: 5,
                }}
              >
                <span style={{ fontSize: 22, lineHeight: 1 }}>
                  {loading ? "⋯" : CATCH_LEVEL_ICONS[lvl]}
                </span>
                <span style={{ fontSize: 10.5, fontWeight: 800, color: c.text, lineHeight: 1.1 }}>
                  {CATCH_LEVEL_LABELS[lvl]}
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 700, color: c.text,
                  background: c.pill, borderRadius: 99,
                  padding: "1.5px 7px",
                  border: `1px solid ${c.border}`,
                  lineHeight: 1.5,
                }}>
                  +{XP_PER_LEVEL[lvl]} pts
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Caught: current level + always-visible upgrades ────────────────────
  const upgrades = ALL_LEVELS.filter((lvl) => lvl > level);
  const c = LEVEL_COLORS[level];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>

      {/* Current level */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "9px 11px",
        background: c.bg, border: `1.5px solid ${c.border}`,
        borderRadius: 12,
      }}>
        <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>
          {CATCH_LEVEL_ICONS[level]}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 11.5, fontWeight: 800, color: c.text, lineHeight: 1.2 }}>
            {CATCH_LEVEL_LABELS[level]}
          </p>
          <p style={{ fontSize: 9, color: c.text, opacity: 0.60, lineHeight: 1.3, marginTop: 1.5 }}>
            {CATCH_LEVEL_DESC[level]}
          </p>
        </div>
        <span style={{
          fontSize: 8.5, fontWeight: 800, color: c.text,
          background: c.pill, borderRadius: 99,
          padding: "2px 7px", flexShrink: 0,
          border: `1px solid ${c.border}`,
        }}>
          ✓ Logged
        </span>
      </div>

      {/* Upgrade options — always visible */}
      {upgrades.length > 0 && (
        <>
          <p style={{
            fontSize: 9, fontWeight: 800, textTransform: "uppercase",
            letterSpacing: "0.10em", color: "rgba(45,27,78,0.30)",
            marginTop: 1,
          }}>
            Level up →
          </p>
          {upgrades.map((lvl) => {
            const uc = LEVEL_COLORS[lvl];
            const loading = loadingLevel === lvl;
            return (
              <button
                key={lvl}
                onClick={() => handleUpgrade(lvl)}
                disabled={isLoading}
                className="w-full flex items-center rounded-xl border-[1.5px] transition-all disabled:opacity-50 hover:brightness-[0.96] active:scale-[0.98]"
                style={{
                  background: uc.bg, borderColor: uc.border,
                  padding: "9px 11px", gap: 10,
                }}
              >
                <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>
                  {loading ? "⋯" : CATCH_LEVEL_ICONS[lvl]}
                </span>
                <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                  <p style={{ fontSize: 11.5, fontWeight: 800, color: uc.text, lineHeight: 1.2 }}>
                    {CATCH_LEVEL_LABELS[lvl]}
                  </p>
                  <p style={{ fontSize: 9, color: uc.text, opacity: 0.60, lineHeight: 1.3, marginTop: 1.5 }}>
                    {CATCH_LEVEL_DESC[lvl]}
                  </p>
                </div>
                <span style={{
                  fontSize: 9, fontWeight: 800, color: uc.text,
                  background: uc.pill, borderRadius: 99,
                  padding: "2px 8px", flexShrink: 0,
                  border: `1px solid ${uc.border}`,
                }}>
                  +{XP_PER_LEVEL[lvl] - XP_PER_LEVEL[level]} pts
                </span>
              </button>
            );
          })}
        </>
      )}

      {/* Undo */}
      {confirming ? (
        <div style={{ display: "flex", gap: 5, marginTop: 1 }}>
          <button
            onClick={handleUnmeet}
            disabled={isLoading}
            className="flex-1 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50"
            style={{
              background: "#fff1f2", color: "#be123c", borderColor: "#fecdd3",
              padding: "5px 0",
            }}
          >
            {removing ? "⋯" : "Confirm remove"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="rounded-lg text-xs border transition-colors"
            style={{
              background: "#fff", color: "rgba(45,27,78,0.40)",
              borderColor: "rgba(45,27,78,0.10)",
              padding: "5px 12px",
            }}
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
