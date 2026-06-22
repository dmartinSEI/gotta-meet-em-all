"use client";

import { useState } from "react";
import Image from "next/image";
import CardModal from "../CardModal";
import type { ConsultantRow } from "@/lib/types";
import { getRarity, CATCH_LEVEL_ICONS, CATCH_LEVEL_LABELS, type Rarity } from "@/lib/xp";
import { pickPhoto } from "@/lib/cards";

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

const AVATAR_COLORS = [
  "bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-orange-500",
  "bg-pink-500", "bg-teal-500", "bg-indigo-500", "bg-rose-500",
];

function CardAvatar({ name }: { name: string }) {
  const initials = name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div className={`w-full h-full flex items-center justify-center text-white font-bold text-2xl ${color}`}>
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

  return (
    <div
      className="relative cursor-pointer rounded-xl overflow-hidden group select-none"
      style={{
        aspectRatio: "5 / 7",
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
      {/* Photo */}
      <div className="absolute inset-0 bg-[#2D1B4E]">
        {photo ? (
          <Image src={photo} alt={fullName} fill sizes="180px" className="object-cover object-top" />
        ) : (
          <CardAvatar name={fullName} />
        )}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />

      {/* Catch level badge */}
      {catchLevel && (
        <div
          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-sm leading-none"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          title={CATCH_LEVEL_LABELS[catchLevel]}
        >
          {CATCH_LEVEL_ICONS[catchLevel]}
        </div>
      )}

      {/* Name */}
      <div className="absolute bottom-0 left-0 right-0 px-2 pb-2">
        <p className="text-white text-[10px] font-semibold leading-tight truncate drop-shadow">
          {fullName}
        </p>
        {consultant.office && (
          <p className="text-[9px] leading-tight truncate" style={{ color: "rgba(255,255,255,0.42)" }}>
            {consultant.office}
          </p>
        )}
      </div>

      {/* Legendary shimmer on hover */}
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
