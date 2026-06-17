"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import CatchButton from "./CatchButton";
import type { ConsultantRow } from "@/lib/types";
import { RARITY_LABELS, RARITY_BADGE_STYLES, CATCH_LEVEL_LABELS } from "@/lib/xp";
import type { Rarity } from "@/lib/xp";

type Level = 1 | 2 | 3;

// Foil rarity from the viewer's relationship with this consultant
function relationshipRarity(catchLevel: number | null): Rarity {
  if (!catchLevel) return "common";
  if (catchLevel === 1) return "uncommon";
  if (catchLevel === 2) return "rare";
  return "legendary";
}

// Foil gradient overlay — moves with mouse position, intensity scales with rarity
function foilStyle(rarity: Rarity, mx: number, my: number): React.CSSProperties {
  if (rarity === "common") return {};

  const angle = mx * 1.8; // hue rotation for legendary rainbow
  const shine = `radial-gradient(circle at ${mx}% ${my}%, rgba(255,255,255,0.55) 0%, transparent 55%)`;

  const base: Record<Exclude<Rarity, "common">, string> = {
    uncommon: `${shine}, linear-gradient(135deg, rgba(74,222,128,0.35) 0%, rgba(16,185,129,0.2) 100%)`,
    rare:     `${shine}, linear-gradient(135deg, rgba(96,165,250,0.45) 0%, rgba(59,130,246,0.25) 100%)`,
    epic:     `${shine}, linear-gradient(135deg, rgba(192,132,252,0.5) 0%, rgba(139,92,246,0.3) 100%)`,
    legendary:`${shine}, linear-gradient(${angle}deg, rgba(255,0,128,0.4), rgba(255,165,0,0.4), rgba(64,224,208,0.4), rgba(160,32,240,0.4), rgba(255,0,128,0.4))`,
  };

  return {
    background: base[rarity as Exclude<Rarity, "common">],
    mixBlendMode: "color-dodge" as const,
    pointerEvents: "none" as const,
  };
}

interface Props {
  consultant: ConsultantRow;
  viewerRarity: Rarity;
  onClose: () => void;
  onLevelChange?: (newLevel: Level | null) => void;
}

export default function CardModal({ consultant, viewerRarity, onClose }: Props) {
  const [flipped, setFlipped] = useState(false);
  const [mouse, setMouse] = useState({ x: 50, y: 50 });
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const dragOrigin = useRef<{ mx: number; my: number; dx: number; dy: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const rarity = consultant.is_own_card
    ? viewerRarity
    : relationshipRarity(consultant.catch_level);

  const fullName = `${consultant.first_name} ${consultant.last_name}`;
  const skillList = consultant.skills
    ? consultant.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const photoForLevel = () => {
    const lvl = consultant.catch_level as Level | null;
    if (lvl === 3 && consultant.photo_url_l3) return consultant.photo_url_l3;
    if (lvl && lvl >= 2 && consultant.photo_url_l2) return consultant.photo_url_l2;
    if (lvl && lvl >= 1 && consultant.photo_url_l1) return consultant.photo_url_l1;
    return consultant.photo_url;
  };
  const photo = photoForLevel();

  // Auto-flip after mount
  useEffect(() => {
    const t = setTimeout(() => setFlipped(true), 250);
    return () => clearTimeout(t);
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Mouse tracking for tilt + foil (only when flipped)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMouse({
      x: Math.round(((e.clientX - rect.left) / rect.width) * 100),
      y: Math.round(((e.clientY - rect.top) / rect.height) * 100),
    });
  }, []);

  const handleMouseLeave = useCallback(() => setMouse({ x: 50, y: 50 }), []);

  // Drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragOrigin.current = { mx: e.clientX, my: e.clientY, dx: drag.x, dy: drag.y };
  }, [drag]);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragOrigin.current) return;
      setDrag({
        x: dragOrigin.current.dx + e.clientX - dragOrigin.current.mx,
        y: dragOrigin.current.dy + e.clientY - dragOrigin.current.my,
      });
    }
    function onUp() { dragOrigin.current = null; }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const tiltX = flipped ? (mouse.y - 50) * 0.18 : 0;
  const tiltY = flipped ? (mouse.x - 50) * -0.18 : 0;

  const rarityBorderColor: Record<Rarity, string> = {
    common:    "1px solid #e5e7eb",
    uncommon:  "2px solid #4ade80",
    rare:      "2px solid #60a5fa",
    epic:      "2px solid #c084fc",
    legendary: "2px solid #fbbf24",
  };

  const rarityGlow: Record<Rarity, string> = {
    common:    "none",
    uncommon:  "0 0 18px 3px rgba(74,222,128,0.35)",
    rare:      "0 0 18px 3px rgba(96,165,250,0.45)",
    epic:      "0 0 24px 6px rgba(192,132,252,0.5)",
    legendary: "0 0 32px 10px rgba(251,191,36,0.55)",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      {/* Card wrapper — centered + draggable */}
      <div
        style={{
          transform: `translate(${drag.x}px, ${drag.y}px)`,
          perspective: "900px",
          width: "280px",
          cursor: dragOrigin.current ? "grabbing" : "grab",
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
      >
        {/* Flip container */}
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            position: "relative",
            width: "280px",
            height: "420px",
            transformStyle: "preserve-3d",
            transition: flipped && !dragOrigin.current
              ? "transform 0.05s ease-out"
              : "transform 0.6s cubic-bezier(0.4,0,0.2,1)",
            transform: flipped
              ? `rotateY(180deg) rotateX(${tiltX}deg) rotateY(calc(180deg + ${tiltY}deg))`
              : "rotateY(0deg)",
            borderRadius: "16px",
            boxShadow: `${rarityGlow[rarity]}, 0 25px 50px rgba(0,0,0,0.4)`,
          }}
        >
          {/* ── FRONT FACE ── */}
          <div style={{
            position: "absolute", inset: 0, backfaceVisibility: "hidden",
            borderRadius: "16px", overflow: "hidden",
            border: rarityBorderColor[rarity], background: "#fff",
          }}>
            {photo ? (
              <Image src={photo} alt={fullName} fill className="object-cover object-top" sizes="280px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-400 text-white font-bold text-5xl">
                {fullName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
              </div>
            )}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
              padding: "24px 16px 16px",
            }}>
              <p className="text-white font-bold text-lg leading-tight">{fullName}</p>
              {consultant.title && <p className="text-white/80 text-sm">{consultant.title}</p>}
            </div>
          </div>

          {/* ── BACK FACE ── */}
          <div style={{
            position: "absolute", inset: 0, backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            borderRadius: "16px", overflow: "hidden",
            border: rarityBorderColor[rarity],
            background: "linear-gradient(160deg, #fff 60%, #f8faff 100%)",
          }}>
            {/* Foil overlay */}
            <div style={{ position: "absolute", inset: 0, borderRadius: "16px", ...foilStyle(rarity, mouse.x, mouse.y) }} />

            <div className="relative z-10 flex flex-col h-full p-4 gap-3 overflow-y-auto">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-gray-900 leading-tight">{fullName}</p>
                  {consultant.title && <p className="text-xs text-gray-500">{consultant.title}</p>}
                  {consultant.office && <p className="text-xs text-gray-400">{consultant.office}</p>}
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${RARITY_BADGE_STYLES[rarity]}`}>
                  {RARITY_LABELS[rarity]}
                </span>
              </div>

              {/* Relationship level */}
              {consultant.catch_level !== null && (
                <div className="text-xs text-center py-1 px-3 rounded-full bg-gray-100 text-gray-600 font-medium self-start">
                  {CATCH_LEVEL_LABELS[consultant.catch_level]} ·{" "}
                  {[10, 25, 50][consultant.catch_level - 1]} XP
                </div>
              )}

              {/* Bio */}
              {consultant.bio ? (
                <p className="text-xs text-gray-600 leading-relaxed">{consultant.bio}</p>
              ) : (
                <p className="text-xs text-gray-300 italic">No bio yet.</p>
              )}

              {/* Skills */}
              {skillList.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {skillList.map((skill, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100">
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Catch button */}
              <div className="mt-auto">
                <CatchButton
                  consultantId={consultant.id}
                  initialLevel={consultant.catch_level as Level | null}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Close hint */}
        <p className="text-center text-white/50 text-xs mt-3 select-none">
          Click outside or press Esc to close
        </p>
      </div>
    </div>
  );
}
