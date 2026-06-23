"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import CardModal from "../CardModal";
import type { ConsultantRow } from "@/lib/types";
import { getRarity, RARITY_LABELS, type Rarity } from "@/lib/xp";
import { pickPhoto, officeImageSrc } from "@/lib/cards";

const RARITY_RING: Record<Rarity, string> = {
  common:    "rgba(255,255,255,0.55)",
  uncommon:  "#4ade80",
  rare:      "#60a5fa",
  epic:      "#c084fc",
  legendary: "#fbbf24",
};

const CARD_GLOW: Record<Rarity, string> = {
  common:    "0 4px 24px rgba(0,0,0,0.18)",
  uncommon:  "0 0 18px 5px rgba(74,222,128,0.40),  0 4px 24px rgba(0,0,0,0.18)",
  rare:      "0 0 18px 5px rgba(96,165,250,0.45),   0 4px 24px rgba(0,0,0,0.18)",
  epic:      "0 0 24px 7px rgba(192,132,252,0.50),  0 4px 24px rgba(0,0,0,0.18)",
  legendary: "0 0 32px 12px rgba(251,191,36,0.60),  0 4px 24px rgba(0,0,0,0.18)",
};

const RARITY_TEXT: Record<Rarity, string> = {
  common:    "rgba(45,27,78,0.40)",
  uncommon:  "#15803d",
  rare:      "#1d4ed8",
  epic:      "#7e22ce",
  legendary: "#b45309",
};

function InitialsAvatar({ name }: { name: string }) {
  const COLORS = ["#3b82f6","#8b5cf6","#10b981","#f97316","#ec4899","#14b8a6","#6366f1","#f43f5e"];
  const initials = name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
  const bg = COLORS[name.charCodeAt(0) % COLORS.length];
  return (
    <div className="w-full h-full flex items-center justify-center text-white font-bold"
         style={{ background: bg, fontSize: 28 }}>
      {initials}
    </div>
  );
}

export default function TrainerCard({
  consultant,
  rosterSize,
}: {
  consultant: ConsultantRow;
  rosterSize: number;
}) {
  const [open, setOpen]   = useState(false);
  const [rect, setRect]   = useState<DOMRect | null>(null);
  const cardRef           = useRef<HTMLDivElement>(null);

  const fullName      = `${consultant.first_name} ${consultant.last_name}`;
  const photo         = pickPhoto(consultant);
  const rarity        = getRarity(consultant.consultant_xp, rosterSize);
  const ringColor     = RARITY_RING[rarity];
  const officeImageUrl = officeImageSrc(consultant.office);

  function handleClick() {
    if (!cardRef.current) return;
    setRect(cardRef.current.getBoundingClientRect());
    setOpen(true);
  }

  return (
    <>
      <div className="flex flex-col items-center gap-3">

        <div
          ref={cardRef}
          onClick={handleClick}
          className="group relative cursor-pointer rounded-xl overflow-hidden select-none"
          style={{
            width: 190,
            height: 253,
            border: `2.5px solid ${ringColor}`,
            boxShadow: CARD_GLOW[rarity],
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.04) translateY(-3px)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; }}
        >
          {/* Office background */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(160deg, #1a0e36 0%, #2D1B4E 100%)",
              ...(officeImageUrl ? {
                backgroundImage: `url(${officeImageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              } : {}),
            }}
          />

          {/* SEI circle decoration */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.07]" aria-hidden>
            {[28, 52, 76].map(r => (
              <circle key={r} cx="110%" cy="50%" r={r} fill="none" stroke="#C8102E" strokeWidth="1" />
            ))}
          </svg>

          {/* Scrim */}
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.22)" }} />

          {/* Circle profile photo */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ paddingBottom: "28%" }}
          >
            <div style={{
              width: 80, height: 80,
              borderRadius: "50%",
              overflow: "hidden",
              border: `3px solid ${ringColor}`,
              boxShadow: "0 0 0 3px rgba(255,255,255,0.08), 0 4px 18px rgba(0,0,0,0.55)",
              position: "relative",
              background: "#2D1B4E",
            }}>
              {photo ? (
                <Image src={photo} alt={fullName} fill sizes="80px" className="object-cover object-top" />
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
              padding: "30px 10px 10px",
            }}
          >
            <p className="text-white font-bold leading-tight truncate" style={{ fontSize: 12 }}>
              {fullName}
            </p>
            {consultant.title && (
              <p className="leading-tight truncate mt-0.5" style={{ fontSize: 10, color: "rgba(255,255,255,0.55)" }}>
                {consultant.title}
              </p>
            )}
          </div>

          {/* Hover overlay */}
          <div
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            style={{ background: "rgba(0,0,0,0.28)" }}
          >
            <span className="text-white text-xs font-bold tracking-wide px-3 py-1.5 rounded-full"
                  style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}>
              View Card →
            </span>
          </div>
        </div>

        {/* Rarity label beneath */}
        <p
          className="text-[10px] font-black tracking-[0.14em] uppercase"
          style={{ color: RARITY_TEXT[rarity] }}
        >
          {RARITY_LABELS[rarity]}
        </p>

      </div>

      {open && rect && (
        <CardModal
          consultant={consultant}
          sourceRect={rect}
          rosterSize={rosterSize}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
