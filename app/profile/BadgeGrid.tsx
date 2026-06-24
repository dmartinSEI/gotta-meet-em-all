"use client";

import { useState } from "react";
import BadgeSVG, { type BadgeItem } from "./BadgeSVG";

const CATEGORY_COLOR: Record<string, string> = {
  Meetings:    "#3b82f6",
  Depth:       "#7c3aed",
  Exploration: "#10b981",
  Bounties:    "#f97316",
  Recognition: "#ca8a04",
  Reciprocity: "#0891b2",
  Consistency: "#475569",
  Prestige:    "#d97706",
  Rank:        "#C8102E",
};

export default function BadgeGrid({ badgeList }: { badgeList: BadgeItem[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const earnedCount = badgeList.filter((b) => b.earnedAt !== null).length;

  const categories: string[] = [];
  const byCategory: Record<string, BadgeItem[]> = {};
  for (const badge of badgeList) {
    if (!byCategory[badge.category]) {
      categories.push(badge.category);
      byCategory[badge.category] = [];
    }
    byCategory[badge.category].push(badge);
  }

  const selected = badgeList.find((b) => b.id === selectedId) ?? null;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(45,27,78,0.08)" }}>

      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between bg-white"
        style={{ borderBottom: "1px solid rgba(45,27,78,0.08)" }}
      >
        <p className="text-[9px] font-black tracking-[0.2em] uppercase text-[#2D1B4E]/40">
          Achievements
        </p>
        <span className="text-xs font-semibold tabular-nums" style={{ color: "rgba(45,27,78,0.38)" }}>
          {earnedCount} / {badgeList.length} earned
        </span>
      </div>

      {/* Category sections */}
      <div className="bg-white">
        {categories.map((category, ci) => {
          const badges  = byCategory[category];
          const earned  = badges.filter((b) => b.earnedAt !== null).length;
          const color   = CATEGORY_COLOR[category] ?? "#2D1B4E";
          const detail  = selected && badges.some((b) => b.id === selected.id) ? selected : null;

          return (
            <div
              key={category}
              style={{ borderTop: ci > 0 ? "1px solid rgba(45,27,78,0.07)" : undefined }}
            >
              {/* Category header */}
              <div className="px-5 pt-4 pb-2 flex items-center gap-2">
                <div style={{ width: 3, height: 14, background: color, borderRadius: 2, flexShrink: 0 }} />
                <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color }}>
                  {category}
                </p>
                <span className="text-[10px] tabular-nums ml-0.5" style={{ color: "rgba(45,27,78,0.30)" }}>
                  {earned}/{badges.length}
                </span>
              </div>

              {/* Badge tiles */}
              <div className="px-4 pb-4 flex flex-wrap gap-3">
                {badges.map((badge) => {
                  const isSelected = selectedId === badge.id;
                  return (
                    <button
                      key={badge.id}
                      type="button"
                      onClick={() => setSelectedId(isSelected ? null : badge.id)}
                      aria-pressed={isSelected}
                      aria-label={badge.name}
                      className="relative transition-transform duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D1B4E]/40 rounded-sm"
                      style={{
                        transform: isSelected ? "scale(1.13)" : "scale(1)",
                        background: "transparent",
                        padding: 0,
                      }}
                    >
                      <BadgeSVG badge={badge} size={64} />
                    </button>
                  );
                })}
              </div>

              {/* Inline detail panel */}
              {detail && (
                <div
                  className="mx-4 mb-4 flex items-start gap-4 p-4 rounded-xl"
                  style={{
                    background: "rgba(45,27,78,0.03)",
                    border: "1px solid rgba(45,27,78,0.09)",
                  }}
                >
                  <BadgeSVG badge={detail} size={72} />
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-[#2D1B4E] text-sm leading-tight">{detail.name}</p>
                      <button
                        type="button"
                        onClick={() => setSelectedId(null)}
                        className="text-xs leading-none shrink-0 transition-colors hover:text-[#2D1B4E]/70"
                        style={{ color: "rgba(45,27,78,0.30)", marginTop: 1 }}
                        aria-label="Close"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-xs mt-1.5 leading-snug" style={{ color: "rgba(45,27,78,0.55)" }}>
                      {detail.description}
                    </p>
                    {detail.earnedAt ? (
                      <p className="text-[10px] mt-2 font-semibold" style={{ color: "#16a34a" }}>
                        ✓ Earned{" "}
                        {new Date(detail.earnedAt).toLocaleDateString("en-US", {
                          month: "long", day: "numeric", year: "numeric",
                        })}
                      </p>
                    ) : (
                      <p className="text-[10px] mt-2" style={{ color: "rgba(45,27,78,0.32)" }}>
                        Not yet earned
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
