"use client";

import { useState } from "react";
import Image from "next/image";
import CardModal from "../CardModal";
import type { ConsultantRow } from "@/lib/types";
import { getRarity, RARITY_HEX, CATCH_LEVEL_ICONS, CATCH_LEVEL_LABELS, type Rarity } from "@/lib/xp";
import { pickPhoto, photoRingStyle, AVATAR_COLORS } from "@/lib/cards";

const CARD_GLOW: Record<Rarity, string> = {
  common:    "0 2px 10px rgba(0,0,0,0.10)",
  uncommon:  "0 0 10px 2px rgba(74,222,128,0.30),  0 2px 10px rgba(0,0,0,0.12)",
  rare:      "0 0 10px 2px rgba(96,165,250,0.35),   0 2px 10px rgba(0,0,0,0.12)",
  epic:      "0 0 14px 3px rgba(192,132,252,0.42),  0 2px 10px rgba(0,0,0,0.12)",
  legendary: "0 0 18px 5px rgba(251,191,36,0.50),   0 2px 10px rgba(0,0,0,0.12)",
};

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

export default function SearchResultsGrid({
  consultants,
  rosterSize,
}: {
  consultants: ConsultantRow[];
  rosterSize: number;
}) {
  const [selectedCard, setSelectedCard] = useState<{ consultant: ConsultantRow; rect: DOMRect } | null>(null);

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {consultants.map((c) => {
          const fullName = `${c.first_name} ${c.last_name}`;
          const photo = pickPhoto(c);
          const caught = c.catch_level !== null;
          const rarity = getRarity(c.consultant_xp, rosterSize);
          const ring = photoRingStyle(rarity, RARITY_HEX[rarity]);
          const cardBg = c.card_bg_url;

          return (
            <div
              key={c.id}
              className="relative cursor-pointer rounded-xl overflow-hidden select-none group"
              style={{
                aspectRatio: "3 / 4",
                border: caught
                  ? `2px solid ${RARITY_HEX[rarity]}`
                  : "1.5px solid rgba(45,27,78,0.10)",
                boxShadow: caught ? CARD_GLOW[rarity] : "0 2px 8px rgba(0,0,0,0.06)",
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
              {/* Background */}
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

              {/* SEI circle decoration */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.07]" aria-hidden>
                {[28, 52, 76].map((r) => (
                  <circle key={r} cx="110%" cy="50%" r={r} fill="none" stroke="#C8102E" strokeWidth="1" />
                ))}
              </svg>

              {/* Scrim */}
              <div
                className="absolute inset-0"
                style={{ background: caught ? "rgba(0,0,0,0.22)" : "rgba(0,0,0,0.48)" }}
              />

              {/* Circular photo */}
              <div className="absolute inset-0 flex items-center justify-center" style={{ paddingBottom: "28%" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  overflow: "hidden", flexShrink: 0,
                  ...ring, position: "relative", background: "#2D1B4E",
                }}>
                  {photo ? (
                    <Image src={photo} alt={fullName} fill sizes="64px" className="object-cover object-top" />
                  ) : (
                    <InitialsAvatar name={fullName} />
                  )}
                </div>
              </div>

              {/* Name strip */}
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

              {/* Top-right: catch level + rank badge */}
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

              {/* Top-left: You pill */}
              {c.is_own_card && (
                <div className="absolute top-1.5 left-1.5">
                  <a
                    href="/profile"
                    className="text-white font-bold rounded leading-none"
                    style={{ fontSize: 9, padding: "3px 6px", background: "rgba(200,16,46,0.80)", backdropFilter: "blur(4px)" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    You
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedCard && (
        <CardModal
          consultant={selectedCard.consultant}
          sourceRect={selectedCard.rect}
          rosterSize={rosterSize}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </>
  );
}
