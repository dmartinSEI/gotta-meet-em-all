"use client";

import { useState } from "react";
import type { BadgeInfo } from "@/lib/types";

type BadgeItem = BadgeInfo & { earnedAt: string | null };

export default function BadgeGrid({ badgeList }: { badgeList: BadgeItem[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const earnedCount = badgeList.filter((b) => b.earnedAt !== null).length;
  const selected    = badgeList.find((b) => b.id === selectedId) ?? null;

  // Preserve category order from the source array
  const categories: string[] = [];
  const byCategory: Record<string, BadgeItem[]> = {};
  for (const badge of badgeList) {
    if (!byCategory[badge.category]) {
      categories.push(badge.category);
      byCategory[badge.category] = [];
    }
    byCategory[badge.category].push(badge);
  }

  function toggle(id: string) {
    setSelectedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="pt-8 border-t" style={{ borderColor: "rgba(45,27,78,0.08)" }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-[9px] font-black tracking-[0.2em] uppercase text-[#2D1B4E]/40">
          Achievements
        </p>
        <span className="text-xs tabular-nums" style={{ color: "rgba(45,27,78,0.40)" }}>
          {earnedCount} / {badgeList.length}
        </span>
      </div>

      {/* Category groups */}
      <div className="space-y-5">
        {categories.map((category) => (
          <div key={category}>
            <p
              className="text-[9px] font-bold uppercase tracking-[0.15em] mb-2"
              style={{ color: "rgba(45,27,78,0.28)" }}
            >
              {category}
            </p>
            <div role="group" aria-label={`${category} badges`} className="flex flex-wrap gap-2">
              {byCategory[category].map((badge) => {
                const isEarned   = badge.earnedAt !== null;
                const isSelected = selectedId === badge.id;
                return (
                  <button
                    key={badge.id}
                    type="button"
                    onClick={() => toggle(badge.id)}
                    aria-pressed={isSelected}
                    aria-label={`${badge.name}: ${badge.description}. ${isEarned ? "Earned" : "Not yet earned"}`}
                    className="relative flex items-center justify-center rounded-xl transition-all duration-100 focus-visible:ring-2 focus-visible:ring-[#2D1B4E]/40 focus-visible:outline-none"
                    style={{
                      width: 52, height: 52,
                      fontSize: 24,
                      background: isSelected
                        ? "rgba(45,27,78,0.09)"
                        : isEarned ? "rgba(45,27,78,0.04)" : "rgba(45,27,78,0.02)",
                      border: isSelected
                        ? "2px solid rgba(45,27,78,0.22)"
                        : "1.5px solid rgba(45,27,78,0.08)",
                      filter:  isEarned ? "none" : "grayscale(1)",
                      opacity: isEarned ? 1 : 0.32,
                    }}
                  >
                    <span aria-hidden="true">{badge.icon}</span>
                    {isEarned && (
                      <span
                        className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-green-500"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      {selected && (
        <div
          role="region"
          aria-live="polite"
          aria-label="Badge details"
          className="mt-5 flex items-start gap-4 px-4 py-4 rounded-xl"
          style={{ background: "rgba(45,27,78,0.04)", border: "1px solid rgba(45,27,78,0.09)" }}
        >
          <span className="text-3xl leading-none shrink-0 mt-0.5" aria-hidden="true">
            {selected.icon}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="font-bold text-sm text-[#2D1B4E] leading-tight">{selected.name}</p>
              {selected.earnedAt ? (
                <span className="text-[10px] font-semibold text-green-600 shrink-0">Earned</span>
              ) : (
                <span className="text-[10px] shrink-0" style={{ color: "rgba(45,27,78,0.35)" }}>
                  Not yet earned
                </span>
              )}
            </div>
            <p className="text-xs leading-snug" style={{ color: "rgba(45,27,78,0.55)" }}>
              {selected.description}
            </p>
            {selected.earnedAt && (
              <p className="text-[10px] mt-1.5" style={{ color: "#C8102E" }}>
                {new Date(selected.earnedAt).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                })}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="shrink-0 transition-colors focus-visible:ring-2 focus-visible:ring-[#2D1B4E]/40 focus-visible:outline-none rounded"
            style={{ color: "rgba(45,27,78,0.30)", fontSize: 12 }}
            aria-label="Close badge details"
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(45,27,78,0.60)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(45,27,78,0.30)")}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
