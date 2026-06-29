"use client";

import { useState } from "react";
import Image from "next/image";
import CardModal from "../CardModal";
import type { ConsultantRow } from "@/lib/types";
import { getRarity, CATCH_LEVEL_ICONS, CATCH_LEVEL_LABELS, type Rarity } from "@/lib/xp";
import { pickPhoto, officeImageSrc, AVATAR_COLORS } from "@/lib/cards";

const CARD_BORDER: Record<Rarity, string> = {
  common:    "1px solid rgba(45,27,78,0.12)",
  uncommon:  "1.5px solid #4ade80",
  rare:      "1.5px solid #60a5fa",
  epic:      "2px solid #c084fc",
  legendary: "2px solid #fbbf24",
};

const CARD_GLOW: Record<Rarity, string> = {
  common:    "0 2px 8px rgba(0,0,0,0.10)",
  uncommon:  "0 0 8px 1px rgba(74,222,128,0.30), 0 2px 8px rgba(0,0,0,0.12)",
  rare:      "0 0 8px 2px rgba(96,165,250,0.35), 0 2px 8px rgba(0,0,0,0.12)",
  epic:      "0 0 12px 3px rgba(192,132,252,0.40), 0 2px 8px rgba(0,0,0,0.12)",
  legendary: "0 0 16px 4px rgba(251,191,36,0.45), 0 2px 8px rgba(0,0,0,0.12)",
};

// Catch level accent — top strip color per level
const LEVEL_STRIP: Record<1 | 2 | 3, string> = {
  1: "transparent",
  2: "linear-gradient(90deg, #0ea5e9 0%, #14b8a6 100%)",
  3: "linear-gradient(90deg, #f59e0b 0%, #f97316 50%, #f59e0b 100%)",
};

const LEVEL_BADGE_SIZE: Record<1 | 2 | 3, string> = {
  1: "w-5 h-5 text-xs",
  2: "w-6 h-6 text-sm",
  3: "w-7 h-7 text-base",
};

function CardAvatar({ name }: { name: string }) {
  const initials = name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  const bg = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div className="w-full h-full flex items-center justify-center text-white font-bold text-2xl"
         style={{ background: bg }}>
      {initials}
    </div>
  );
}

interface Props {
  consultants: ConsultantRow[];
  totalRoster: number;
  totalsByOffice: Record<string, number>;
}

export default function CollectionGallery({ consultants, totalRoster, totalsByOffice }: Props) {
  const [selected, setSelected] = useState<{ consultant: ConsultantRow; rect: DOMRect } | null>(null);

  // Group consultants by office, preserving server-side order
  const officeOrder: string[] = [];
  const byOffice: Record<string, ConsultantRow[]> = {};
  for (const c of consultants) {
    const office = c.office || "Other";
    if (!byOffice[office]) {
      officeOrder.push(office);
      byOffice[office] = [];
    }
    byOffice[office].push(c);
  }

  const pct = totalRoster > 0 ? Math.round((consultants.length / totalRoster) * 100) : 0;

  return (
    <>
      {/* ── Summary banner ──────────────────────────────────────── */}
      <div
        className="relative rounded-2xl px-6 py-5 mb-10 flex flex-wrap items-center gap-x-8 gap-y-4 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #2D1B4E 0%, #1a0e36 100%)" }}
      >
        <svg
          className="absolute right-0 top-0 h-full w-56 opacity-[0.10] pointer-events-none"
          viewBox="0 0 224 90"
          preserveAspectRatio="xMaxYMid meet"
          aria-hidden
        >
          {[30, 56, 82, 108, 134, 160].map((r) => (
            <circle key={r} cx="224" cy="45" r={r} fill="none" stroke="#C8102E" strokeWidth="1" />
          ))}
        </svg>

        <div className="relative">
          <p className="text-[#C8102E] text-[9px] font-black uppercase tracking-[0.22em] mb-1">Collected</p>
          <p className="text-white font-black text-3xl leading-none tabular-nums">
            {consultants.length}
            <span className="text-white/30 text-xl font-normal ml-1.5">/ {totalRoster}</span>
          </p>
        </div>

        <div className="relative flex-1 min-w-48">
          {pct === 100 && (
            <p className="text-green-400 text-xs font-semibold mb-2">Complete! 🎉</p>
          )}
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.10)" }}>
            <div
              className="h-2 rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: pct === 100 ? "#22c55e" : "#C8102E" }}
            />
          </div>
        </div>
      </div>

      {/* ── Office sections ─────────────────────────────────────── */}
      <div className="flex flex-col gap-12">
        {officeOrder.map((office) => {
          const cards = byOffice[office];
          const officeTotal = totalsByOffice[office] ?? cards.length;
          const officePct = officeTotal > 0 ? Math.round((cards.length / officeTotal) * 100) : 0;
          const done = cards.length === officeTotal && officeTotal > 0;

          return (
            <section key={office}>
              {/* Office header */}
              <div className="flex items-center gap-3 mb-4">
                <h2 className="font-black text-[#2D1B4E] text-base leading-none whitespace-nowrap">
                  {office}
                </h2>
                <div className="flex-1 h-px" style={{ background: "rgba(45,27,78,0.10)" }} />
                <span className="text-xs tabular-nums whitespace-nowrap" style={{ color: "rgba(45,27,78,0.40)" }}>
                  {cards.length} / {officeTotal}
                </span>
                <div
                  className="w-16 h-1.5 rounded-full overflow-hidden shrink-0"
                  style={{ background: "rgba(45,27,78,0.08)" }}
                >
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${officePct}%`, background: done ? "#22c55e" : "#C8102E" }}
                  />
                </div>
              </div>

              {/* Card grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                {cards.map((consultant) => (
                  <CollectionCard
                    key={consultant.id}
                    consultant={consultant}
                    rosterSize={totalRoster}
                    onOpen={(c, rect) => setSelected({ consultant: c, rect })}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {selected && (
        <CardModal
          consultant={selected.consultant}
          sourceRect={selected.rect}
          rosterSize={totalRoster}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

const RARITY_RING: Record<Rarity, string> = {
  common:    "rgba(255,255,255,0.55)",
  uncommon:  "#4ade80",
  rare:      "#60a5fa",
  epic:      "#c084fc",
  legendary: "#fbbf24",
};

function CollectionCard({
  consultant,
  rosterSize,
  onOpen,
}: {
  consultant: ConsultantRow;
  rosterSize: number;
  onOpen: (c: ConsultantRow, rect: DOMRect) => void;
}) {
  const rarity = getRarity(consultant.consultant_xp, rosterSize);
  const photo = pickPhoto(consultant);
  const fullName = `${consultant.first_name} ${consultant.last_name}`;
  const catchLevel = consultant.catch_level as 1 | 2 | 3 | null;
  const ringColor = RARITY_RING[rarity];
  const bgImageUrl = consultant.card_bg_url || officeImageSrc(consultant.office);

  return (
    <div
      className="relative cursor-pointer rounded-xl overflow-hidden group select-none"
      style={{
        aspectRatio: "3 / 4",
        border: CARD_BORDER[rarity],
        boxShadow: CARD_GLOW[rarity],
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
      onClick={(e) => onOpen(consultant, e.currentTarget.getBoundingClientRect())}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "scale(1.05) translateY(-3px)";
        (e.currentTarget as HTMLElement).style.zIndex = "10";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "scale(1) translateY(0)";
        (e.currentTarget as HTMLElement).style.zIndex = "auto";
      }}
    >
      {/* Office background — CSS bg-image gives silent 404 fallback to the gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(160deg, #1a0e36 0%, #2D1B4E 100%)",
          ...(bgImageUrl ? {
            backgroundImage: `url(${bgImageUrl})`,
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

      {/* Circular profile photo — centered, shifted up */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ paddingBottom: "28%" }}>
        <div
          style={{
            width: 60, height: 60,
            borderRadius: "50%",
            overflow: "hidden",
            flexShrink: 0,
            border: `3px solid ${ringColor}`,
            boxShadow: `0 0 0 3px rgba(255,255,255,0.07), 0 4px 16px rgba(0,0,0,0.55)`,
            position: "relative",
            background: "#2D1B4E",
          }}
        >
          {photo ? (
            <Image src={photo} alt={fullName} fill sizes="60px" className="object-cover object-top" />
          ) : (
            <CardAvatar name={fullName} />
          )}
        </div>
      </div>

      {/* Bottom name strip */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.35) 65%, transparent 100%)",
          padding: "26px 8px 8px",
        }}
      >
        <p className="text-white font-bold leading-tight truncate" style={{ fontSize: 10 }}>
          {fullName}
        </p>
        {consultant.office && (
          <p className="leading-tight truncate mt-0.5" style={{ fontSize: 9, color: "rgba(255,255,255,0.45)" }}>
            {consultant.office}
          </p>
        )}
      </div>

      {/* Catch level top accent strip */}
      {catchLevel && catchLevel >= 2 && (
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: LEVEL_STRIP[catchLevel as 2 | 3] }}
        />
      )}

      {/* Catch level badge */}
      {catchLevel && (
        <div
          className={`absolute top-1.5 right-1.5 rounded-full flex items-center justify-center leading-none ${LEVEL_BADGE_SIZE[catchLevel as 1 | 2 | 3]}`}
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          title={CATCH_LEVEL_LABELS[catchLevel]}
        >
          {CATCH_LEVEL_ICONS[catchLevel]}
        </div>
      )}

      {/* Level 3 delivered shimmer */}
      {catchLevel === 3 && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(245,158,11,0.18), rgba(249,115,22,0.12), rgba(245,158,11,0.18))",
            mixBlendMode: "screen",
          }}
        />
      )}

      {/* Legendary rarity shimmer */}
      {rarity === "legendary" && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(255,200,0,0.15), rgba(255,100,0,0.10), rgba(255,200,0,0.15))",
            mixBlendMode: "screen",
          }}
        />
      )}
    </div>
  );
}
