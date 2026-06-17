"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import CatchButton from "./CatchButton";
import type { ConsultantRow } from "@/lib/types";
import { RARITY_LABELS, RARITY_BADGE_STYLES, CATCH_LEVEL_LABELS } from "@/lib/xp";
import type { Rarity } from "@/lib/xp";
import { pickPhoto, catchLevelToRarity } from "@/lib/cards";

type Level = 1 | 2 | 3;
type Phase = "init" | "flying" | "flipping" | "ready";

const CARD_W = 280;
const CARD_H = 420;

function foilOverlay(rarity: Rarity, mx: number, my: number): React.CSSProperties {
  if (rarity === "common") return {};
  const angle = mx * 1.8;
  const shine = `radial-gradient(circle at ${mx}% ${my}%, rgba(255,255,255,0.6) 0%, transparent 55%)`;
  const gradients: Record<Exclude<Rarity, "common">, string> = {
    uncommon: `${shine}, linear-gradient(135deg, rgba(74,222,128,0.35), rgba(16,185,129,0.2))`,
    rare:     `${shine}, linear-gradient(135deg, rgba(96,165,250,0.45), rgba(59,130,246,0.25))`,
    epic:     `${shine}, linear-gradient(135deg, rgba(192,132,252,0.5), rgba(139,92,246,0.3))`,
    legendary:`${shine}, linear-gradient(${angle}deg, rgba(255,0,128,0.4), rgba(255,165,0,0.4), rgba(64,224,208,0.4), rgba(160,32,240,0.4), rgba(255,0,128,0.4))`,
  };
  return {
    background: gradients[rarity as Exclude<Rarity, "common">],
    mixBlendMode: "color-dodge" as const,
    pointerEvents: "none" as const,
  };
}

const RARITY_BORDER: Record<Rarity, string> = {
  common:    "1px solid #e5e7eb",
  uncommon:  "2px solid #4ade80",
  rare:      "2px solid #60a5fa",
  epic:      "2px solid #c084fc",
  legendary: "2px solid #fbbf24",
};

const RARITY_GLOW: Record<Rarity, string> = {
  common:    "0 25px 50px rgba(0,0,0,0.4)",
  uncommon:  "0 0 18px 3px rgba(74,222,128,0.4), 0 25px 50px rgba(0,0,0,0.4)",
  rare:      "0 0 18px 3px rgba(96,165,250,0.5), 0 25px 50px rgba(0,0,0,0.4)",
  epic:      "0 0 24px 6px rgba(192,132,252,0.55), 0 25px 50px rgba(0,0,0,0.4)",
  legendary: "0 0 32px 10px rgba(251,191,36,0.6), 0 25px 50px rgba(0,0,0,0.4)",
};

interface Props {
  consultant: ConsultantRow;
  sourceRect: DOMRect;
  viewerRarity: Rarity;
  onClose: () => void;
}

export default function CardModal({ consultant, sourceRect, viewerRarity, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>("init");
  const [mouse, setMouse] = useState({ x: 50, y: 50 });
  const cardRef = useRef<HTMLDivElement>(null);

  const rarity = consultant.is_own_card
    ? viewerRarity
    : catchLevelToRarity(consultant.catch_level);

  const fullName = `${consultant.first_name} ${consultant.last_name}`;
  const skillList = consultant.skills
    ? consultant.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const photo = pickPhoto(consultant);

  // Compute initial offset: make the modal card appear at the source card's screen position
  const initOffset = useMemo(() => {
    const destCX = window.innerWidth / 2;
    const destCY = window.innerHeight / 2;
    const srcCX = sourceRect.left + sourceRect.width / 2;
    const srcCY = sourceRect.top + sourceRect.height / 2;
    return {
      x: srcCX - destCX,
      y: srcCY - destCY,
      scale: sourceRect.width / CARD_W,
    };
  }, [sourceRect]);

  // Phase sequence: init → flying → flipping → ready
  useEffect(() => {
    const raf = requestAnimationFrame(() => setPhase("flying"));
    const t1 = setTimeout(() => setPhase("flipping"), 420);
    const t2 = setTimeout(() => setPhase("ready"), 420 + 560);
    return () => { cancelAnimationFrame(raf); clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (phase !== "ready" || !cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    setMouse({
      x: Math.round(((e.clientX - r.left) / r.width) * 100),
      y: Math.round(((e.clientY - r.top) / r.height) * 100),
    });
  }, [phase]);

  const handleMouseLeave = useCallback(() => setMouse({ x: 50, y: 50 }), []);

  // Positioner: flies card from source to center
  const positionerTransform = phase === "init"
    ? `translate(${initOffset.x}px, ${initOffset.y}px) scale(${initOffset.scale})`
    : "translate(0,0) scale(1)";
  const positionerTransition = phase === "flying"
    ? "transform 0.42s cubic-bezier(0.34,1.56,0.64,1)"
    : "none";

  // Flipper: rotates card from front to back, then tracks mouse tilt
  const tiltX = phase === "ready" ? (mouse.y - 50) * 0.14 : 0;
  const tiltY = phase === "ready" ? (mouse.x - 50) * -0.14 : 0;
  const flipperTransform =
    phase === "init" || phase === "flying"  ? "rotateY(0deg)"
    : phase === "flipping"                  ? "rotateY(180deg)"
    : `rotateY(${180 + tiltY}deg) rotateX(${tiltX}deg)`;
  const flipperTransition =
    phase === "flipping" ? "transform 0.56s cubic-bezier(0.4,0,0.2,1)"
    : phase === "ready"  ? "transform 0.08s ease-out"
    : "none";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        backgroundColor: phase === "init" ? "rgba(0,0,0,0)" : "rgba(0,0,0,0.72)",
        backdropFilter: phase === "init" ? "blur(0px)" : "blur(5px)",
        transition: "background-color 0.35s ease, backdrop-filter 0.35s ease",
      }}
      onClick={onClose}
    >
      {/* Positioner — handles fly from source rect to center */}
      <div
        style={{ transform: positionerTransform, transition: positionerTransition }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Perspective wrapper */}
        <div style={{ perspective: "900px", width: CARD_W, height: CARD_H }}>
          {/* Flipper — handles flip + tilt */}
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              position: "relative",
              width: CARD_W,
              height: CARD_H,
              transformStyle: "preserve-3d",
              transform: flipperTransform,
              transition: flipperTransition,
              borderRadius: 16,
              boxShadow: RARITY_GLOW[rarity],
            }}
          >
            {/* ── FRONT FACE ── */}
            <div style={{
              position: "absolute", inset: 0, backfaceVisibility: "hidden",
              borderRadius: 16, overflow: "hidden",
              border: RARITY_BORDER[rarity], background: "#fff",
            }}>
              {photo ? (
                <Image src={photo} alt={fullName} fill sizes="280px" className="object-cover object-top" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-400 text-white font-bold text-5xl">
                  {fullName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                </div>
              )}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
                padding: "28px 16px 16px",
              }}>
                <p className="text-white font-bold text-lg leading-tight">{fullName}</p>
                {consultant.title && <p className="text-white/75 text-sm">{consultant.title}</p>}
              </div>
            </div>

            {/* ── BACK FACE ── */}
            <div style={{
              position: "absolute", inset: 0, backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              borderRadius: 16, overflow: "hidden",
              border: RARITY_BORDER[rarity],
              background: "linear-gradient(160deg, #fff 55%, #f5f8ff 100%)",
            }}>
              {/* Foil shimmer overlay */}
              <div style={{ position: "absolute", inset: 0, borderRadius: 16, ...foilOverlay(rarity, mouse.x, mouse.y) }} />

              <div className="relative z-10 flex flex-col h-full p-4 gap-3 overflow-y-auto">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-gray-900 leading-tight">{fullName}</p>
                    {consultant.title  && <p className="text-xs text-gray-500">{consultant.title}</p>}
                    {consultant.office && <p className="text-xs text-gray-400">{consultant.office}</p>}
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${RARITY_BADGE_STYLES[rarity]}`}>
                    {RARITY_LABELS[rarity]}
                  </span>
                </div>

                {consultant.catch_level !== null && (
                  <div className="text-xs py-1 px-3 rounded-full bg-gray-100 text-gray-600 font-medium self-start">
                    {CATCH_LEVEL_LABELS[consultant.catch_level]} · {[10, 25, 50][consultant.catch_level - 1]} XP
                  </div>
                )}

                {consultant.bio ? (
                  <p className="text-xs text-gray-600 leading-relaxed">{consultant.bio}</p>
                ) : (
                  <p className="text-xs text-gray-300 italic">No bio yet.</p>
                )}

                {skillList.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {skillList.map((skill, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-auto">
                  <CatchButton consultantId={consultant.id} initialLevel={consultant.catch_level as Level | null} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-white/40 text-xs mt-3 select-none">
          Click outside or press Esc to close
        </p>
      </div>
    </div>
  );
}
