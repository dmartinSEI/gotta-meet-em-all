"use client";

import { useEffect, useRef, useState } from "react";
import { catchConsultant, upgradeConsultant, uncatchConsultant } from "./actions";
import type { BadgeInfo } from "@/lib/types";

type Level = 1 | 2 | 3;

const LEVEL_LABELS: Record<Level, string> = {
  1: "Met",
  2: "Collaborated",
  3: "Partnered",
};

const LEVEL_STYLES: Record<Level, string> = {
  1: "bg-blue-50 text-blue-700 border-blue-200",
  2: "bg-green-50 text-green-700 border-green-200",
  3: "bg-purple-50 text-purple-700 border-purple-200",
};

const LEVEL_DOTS: Record<Level, string> = { 1: "●○○", 2: "●●○", 3: "●●●" };

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
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function handleMeet() {
    setLoading(true);
    const result = await catchConsultant(consultantId);
    if (result.success) {
      setLevel(1);
      fireBadgeEvent(result.newBadges);
    }
    setLoading(false);
  }

  async function handleUpgrade() {
    if (!level || level >= 3) return;
    setLoading(true);
    const newLevel = (level + 1) as 2 | 3;
    const result = await upgradeConsultant(consultantId, newLevel);
    if (result.success) {
      setLevel(newLevel);
      fireBadgeEvent(result.newBadges);
    }
    setLoading(false);
  }

  async function handleUnmeet() {
    setLoading(true);
    const result = await uncatchConsultant(consultantId);
    if (result.success) setLevel(null);
    else setConfirming(false);
    setLoading(false);
  }

  if (level === null) {
    return (
      <button
        onClick={handleMeet}
        disabled={loading}
        className="w-full py-1.5 rounded-lg text-sm font-bold border transition-colors disabled:opacity-50 bg-gray-50 text-gray-600 border-gray-200 hover:bg-blue-600 hover:text-white hover:border-blue-600"
      >
        {loading ? "…" : "Meet!"}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className={`w-full py-1.5 rounded-lg text-xs font-semibold border text-center ${LEVEL_STYLES[level]}`}>
        {LEVEL_DOTS[level]} {LEVEL_LABELS[level]}
      </div>

      {level < 3 && (
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full py-1 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
        >
          {loading ? "…" : `↑ ${LEVEL_LABELS[(level + 1) as Level]}`}
        </button>
      )}

      {confirming ? (
        <div className="flex gap-1">
          <button
            onClick={handleUnmeet}
            disabled={loading}
            className="flex-1 py-1 rounded-lg text-xs font-medium border bg-red-50 text-red-600 border-red-200 hover:bg-red-100 disabled:opacity-50"
          >
            {loading ? "…" : "Remove"}
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
