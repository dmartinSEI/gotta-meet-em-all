"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import CardModal from "./CardModal";
import type { ConsultantRow } from "@/lib/types";
import { getRarity, RARITY_HEX, CATCH_LEVEL_ICONS, CATCH_LEVEL_LABELS, type Rarity } from "@/lib/xp";
import { pickPhoto, photoRingStyle } from "@/lib/cards";

type StatusFilter = "all" | "unmet" | "met";


const CARD_GLOW: Record<Rarity, string> = {
  common:    "0 2px 10px rgba(0,0,0,0.10)",
  uncommon:  "0 0 10px 2px rgba(74,222,128,0.30),  0 2px 10px rgba(0,0,0,0.12)",
  rare:      "0 0 10px 2px rgba(96,165,250,0.35),   0 2px 10px rgba(0,0,0,0.12)",
  epic:      "0 0 14px 3px rgba(192,132,252,0.42),  0 2px 10px rgba(0,0,0,0.12)",
  legendary: "0 0 18px 5px rgba(251,191,36,0.50),   0 2px 10px rgba(0,0,0,0.12)",
};

const AVATAR_COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f97316",
  "#ec4899", "#14b8a6", "#6366f1", "#f43f5e",
];

function InitialsAvatar({ name }: { name: string }) {
  const initials = name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  const bg = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl"
         style={{ background: bg }}>
      {initials}
    </div>
  );
}

export default function ConsultantGrid({
  consultants,
  rosterSize,
  officeName,
  officeImageUrl,
}: {
  consultants: ConsultantRow[];
  rosterSize: number;
  officeName: string;
  officeImageUrl?: string | null;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedCard, setSelectedCard] = useState<{ consultant: ConsultantRow; rect: DOMRect } | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return consultants.filter((c) => {
      if (q && !`${c.first_name} ${c.last_name}`.toLowerCase().includes(q)) return false;
      if (statusFilter === "met"   && c.catch_level === null) return false;
      if (statusFilter === "unmet" && c.catch_level !== null) return false;
      return true;
    });
  }, [consultants, search, statusFilter]);

  const newHires = consultants.filter((c) => c.is_new_hire);

  return (
    <div>

      {/* ── New Hires spotlight ─────────────────────────────────────────── */}
      {newHires.length > 0 && (
        <div className="mb-7 rounded-2xl overflow-hidden" style={{
          background: "linear-gradient(135deg, rgba(45,27,78,0.03) 0%, rgba(34,197,94,0.05) 100%)",
          border: "1.5px solid rgba(34,197,94,0.22)",
        }}>
          <div className="px-5 pt-4 pb-5">
            <div className="flex items-center gap-2.5 mb-4">
              <span style={{ fontSize: 18 }}>👋</span>
              <p className="text-sm font-black text-[#2D1B4E]">New to the Team</p>
              <span style={{
                fontSize: 9.5, fontWeight: 700, color: "#15803d",
                background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
                padding: "1px 8px", borderRadius: 99,
              }}>
                {newHires.length} {newHires.length === 1 ? "person" : "people"}
              </span>
            </div>
            <div className="flex gap-5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {newHires.map((c) => {
                const fullName = `${c.first_name} ${c.last_name}`;
                const photo = pickPhoto(c);
                const rarity = getRarity(c.consultant_xp, rosterSize);
                const ring = photoRingStyle(rarity, RARITY_HEX[rarity]);
                return (
                  <div
                    key={c.id}
                    className="shrink-0 flex flex-col items-center gap-2 cursor-pointer group"
                    style={{ width: 76 }}
                    onClick={(e) => setSelectedCard({ consultant: c, rect: e.currentTarget.getBoundingClientRect() })}
                  >
                    <div style={{
                      width: 64, height: 64, borderRadius: "50%",
                      overflow: "hidden", position: "relative", flexShrink: 0,
                      ...ring, background: "#2D1B4E",
                    }}
                      className="transition-transform duration-150 group-hover:scale-105"
                    >
                      {photo ? (
                        <Image src={photo} alt={fullName} fill sizes="64px" className="object-cover object-top" />
                      ) : (
                        <InitialsAvatar name={fullName} />
                      )}
                    </div>
                    <div className="text-center" style={{ width: "100%" }}>
                      <p className="font-bold leading-tight truncate" style={{ fontSize: 10.5, color: "#2D1B4E" }}>
                        {c.first_name}
                      </p>
                      <p className="font-bold leading-tight truncate" style={{ fontSize: 10.5, color: "#2D1B4E" }}>
                        {c.last_name}
                      </p>
                      {c.title && (
                        <p className="leading-tight truncate mt-0.5" style={{ fontSize: 9, color: "rgba(45,27,78,0.45)" }}>
                          {c.title}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="search"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-4 py-2 text-sm rounded-xl focus:outline-none"
          style={{
            border: "1.5px solid rgba(45,27,78,0.12)",
            background: "#fff",
            color: "#2D1B4E",
          }}
        />
        <div className="flex rounded-xl overflow-hidden text-sm" style={{ border: "1.5px solid rgba(45,27,78,0.12)" }}>
          {(["all", "unmet", "met"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="px-4 py-2 capitalize transition-colors"
              style={statusFilter === s
                ? { background: "#2D1B4E", color: "#fff" }
                : { background: "#fff", color: "rgba(45,27,78,0.55)" }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[10px] font-medium mb-4" style={{ color: "rgba(45,27,78,0.35)" }}>
        {filtered.length} of {consultants.length} consultants
      </p>

      {filtered.length === 0 ? (
        <p className="text-center py-16 text-sm" style={{ color: "rgba(45,27,78,0.35)" }}>
          No consultants match your filters.
        </p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {filtered.map((c) => {
            const fullName = `${c.first_name} ${c.last_name}`;
            const photo = pickPhoto(c);
            const caught = c.catch_level !== null;
            const rarity = getRarity(c.consultant_xp, rosterSize);
            const ring = photoRingStyle(rarity, RARITY_HEX[rarity]);
            const cardBg = c.card_bg_url || officeImageUrl;

            return (
              <div
                key={c.id}
                className="relative cursor-pointer rounded-xl overflow-hidden select-none group"
                style={{
                  aspectRatio: "3 / 4",
                  border: caught
                    ? `2px solid ${RARITY_HEX[rarity]}`
                    : "1.5px solid rgba(45,27,78,0.10)",
                  boxShadow: caught
                    ? CARD_GLOW[rarity]
                    : "0 2px 8px rgba(0,0,0,0.06)",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
                onClick={(e) => setSelectedCard({ consultant: c, rect: e.currentTarget.getBoundingClientRect() })}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "scale(1.04) translateY(-2px)";
                  (e.currentTarget as HTMLElement).style.zIndex = "10";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "";
                  (e.currentTarget as HTMLElement).style.zIndex = "";
                }}
              >
                {/* Office background — CSS bg-image gives silent 404 fallback to the gradient */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(160deg, #1a0e36 0%, #2D1B4E 100%)",
                    ...(cardBg ? {
                      backgroundImage: `url(${cardBg})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    } : {}),
                  }}
                />

                {/* Subtle SEI circle decoration */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.07]" aria-hidden>
                  {[28, 52, 76].map((r) => (
                    <circle key={r} cx="110%" cy="50%" r={r} fill="none" stroke="#C8102E" strokeWidth="1" />
                  ))}
                </svg>

                {/* Scrim — lighter when caught so the photo pops */}
                <div
                  className="absolute inset-0"
                  style={{ background: caught ? "rgba(0,0,0,0.22)" : "rgba(0,0,0,0.48)" }}
                />

                {/* Circular profile photo — centered, shifted up */}
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ paddingBottom: "28%" }}
                >
                  <div
                    style={{
                      width: 64, height: 64,
                      borderRadius: "50%",
                      overflow: "hidden",
                      flexShrink: 0,
                      ...ring,
                      position: "relative",
                      background: "#2D1B4E",
                    }}
                  >
                    {photo ? (
                      <Image src={photo} alt={fullName} fill sizes="64px" className="object-cover object-top" />
                    ) : (
                      <InitialsAvatar name={fullName} />
                    )}
                  </div>
                </div>

                {/* Bottom name strip */}
                <div
                  className="absolute bottom-0 left-0 right-0"
                  style={{
                    background: "linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.35) 65%, transparent 100%)",
                    padding: "28px 9px 9px",
                  }}
                >
                  <p className="text-white font-bold leading-tight truncate" style={{ fontSize: 11 }}>
                    {fullName}
                  </p>
                  {c.title && (
                    <p className="leading-tight truncate mt-0.5" style={{ fontSize: 9, color: "rgba(255,255,255,0.48)" }}>
                      {c.title}
                    </p>
                  )}
                </div>

                {/* Top-right badge column: catch level + top-10 rank */}
                {(caught || (c.alltime_rank && c.alltime_rank <= 10)) && (
                  <div className="absolute top-1.5 right-1.5 flex flex-col items-end gap-1">
                    {caught && (
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-xs leading-none"
                        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
                        title={CATCH_LEVEL_LABELS[c.catch_level!]}
                      >
                        {CATCH_LEVEL_ICONS[c.catch_level!]}
                      </div>
                    )}
                    {c.alltime_rank && c.alltime_rank <= 10 && (
                      <div
                        className="flex items-center gap-0.5 rounded px-1"
                        style={{
                          height: 16,
                          background: "rgba(10,6,24,0.78)",
                          backdropFilter: "blur(4px)",
                          border: "1px solid rgba(251,191,36,0.55)",
                        }}
                        title={`#${c.alltime_rank} All Time`}
                      >
                        <span style={{ fontSize: 8, lineHeight: 1 }}>🏆</span>
                        <span style={{ fontSize: 8, fontWeight: 800, color: "#fbbf24", lineHeight: 1 }}>
                          #{c.alltime_rank}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Top-left: "NEW" badge and/or "You" pill */}
                {(c.is_new_hire || c.is_own_card) && (
                  <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                    {c.is_new_hire && (
                      <span style={{
                        fontSize: 8, fontWeight: 800, color: "#fff",
                        padding: "2px 5px", borderRadius: 3,
                        background: "rgba(34,197,94,0.88)", backdropFilter: "blur(4px)",
                        letterSpacing: "0.06em", lineHeight: 1.4,
                      }}>
                        NEW
                      </span>
                    )}
                    {c.is_own_card && (
                      <a
                        href="/profile"
                        className="text-white font-bold rounded leading-none"
                        style={{ fontSize: 9, padding: "3px 6px", background: "rgba(200,16,46,0.80)", backdropFilter: "blur(4px)" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        You
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedCard && (
        <CardModal
          consultant={selectedCard.consultant}
          sourceRect={selectedCard.rect}
          rosterSize={rosterSize}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </div>
  );
}
