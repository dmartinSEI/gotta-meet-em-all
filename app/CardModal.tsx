"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import CatchButton from "./CatchButton";
import type { ConsultantRow, PreferredComm } from "@/lib/types";
import { getRarity, RARITY_HEX, RARITY_HEADER, RARITY_LABELS, CATCH_LEVEL_LABELS, CATCH_LEVEL_ICONS, XP_PER_LEVEL } from "@/lib/xp";
import type { Rarity } from "@/lib/xp";
import { pickPhoto, photoRingStyle, officeImageSrc } from "@/lib/cards";
import { BADGE_MAP } from "@/lib/badge-data";

type Level = 1 | 2 | 3;
type Phase = "init" | "flying" | "flipping" | "ready";

const COMM_ICONS: Record<PreferredComm, string> = {
  "Email":           "✉️",
  "Teams":           "💬",
  "Calendar Invite": "📅",
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 8, textTransform: "uppercase", letterSpacing: "0.1em",
  color: "#94a3b8", fontWeight: 700, marginBottom: 4,
};

function BadgeTooltip({ badge }: { badge: { id: string; name: string; icon: string; description: string } }) {
  const [show, setShow] = useState(false);
  return (
    <span
      style={{ position: "relative", fontSize: 17, lineHeight: 1, cursor: "default", display: "inline-block" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {badge.icon}
      {show && (
        <span style={{
          position: "absolute", bottom: "calc(100% + 5px)", left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(15,23,42,0.90)", color: "#fff",
          fontSize: 9, fontWeight: 600, whiteSpace: "nowrap",
          padding: "3px 8px", borderRadius: 5,
          pointerEvents: "none", zIndex: 20,
        }}>
          {badge.name}
        </span>
      )}
    </span>
  );
}

const CARD_W = 280;
const CARD_H = 420;

const RARITY_GLOW: Record<Rarity, string> = {
  common:    "0 25px 50px rgba(0,0,0,0.4)",
  uncommon:  "0 0 20px 4px rgba(74,222,128,0.35),  0 25px 50px rgba(0,0,0,0.4)",
  rare:      "0 0 20px 4px rgba(96,165,250,0.4),   0 25px 50px rgba(0,0,0,0.4)",
  epic:      "0 0 26px 7px rgba(192,132,252,0.45), 0 25px 50px rgba(0,0,0,0.4)",
  legendary: "0 0 36px 12px rgba(251,191,36,0.55), 0 25px 50px rgba(0,0,0,0.4)",
};

function foilStyle(rarity: Rarity, mx: number, my: number): React.CSSProperties {
  if (rarity === "common") return { display: "none" };
  const angle = mx * 1.8;
  const shine = `radial-gradient(circle at ${mx}% ${my}%, rgba(255,255,255,0.22) 0%, transparent 60%)`;
  const overlays: Record<Exclude<Rarity, "common">, string> = {
    uncommon:  `${shine}, linear-gradient(135deg, rgba(74,222,128,0.22), rgba(16,185,129,0.14))`,
    rare:      `${shine}, linear-gradient(135deg, rgba(96,165,250,0.26), rgba(59,130,246,0.16))`,
    epic:      `${shine}, linear-gradient(135deg, rgba(192,132,252,0.28), rgba(139,92,246,0.18))`,
    legendary: `${shine}, linear-gradient(${angle}deg, rgba(255,0,128,0.24), rgba(255,165,0,0.24), rgba(64,224,208,0.24), rgba(160,32,240,0.24), rgba(255,0,128,0.24))`,
  };
  return {
    background:   overlays[rarity as Exclude<Rarity, "common">],
    mixBlendMode: "screen" as const,
    pointerEvents: "none" as const,
  };
}


interface Props {
  consultant: ConsultantRow;
  sourceRect: DOMRect;
  rosterSize: number;
  onClose: () => void;
}

export default function CardModal({ consultant, sourceRect, rosterSize, onClose }: Props) {
  const [phase, setPhase]        = useState<Phase>("init");
  const [mouse, setMouse]        = useState({ x: 50, y: 50 });
  const [flipped, setFlipped]    = useState(true);
  const [isUserFlipping, setIsUserFlipping] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const rarity      = getRarity(consultant.consultant_xp, rosterSize);
  const fullName    = `${consultant.first_name} ${consultant.last_name}`;
  const photo       = pickPhoto(consultant);
  const skillList   = consultant.skills
    ? consultant.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const earnedBadges = (consultant.badge_ids ?? [])
    .map((id) => BADGE_MAP.get(id))
    .filter((b): b is NonNullable<typeof b> => b !== undefined);

  const rarityColor  = RARITY_HEX[rarity];
  const cardBorder   = `4px solid ${rarityColor}`;
  const officeImageUrl = consultant.card_bg_url || officeImageSrc(consultant.office);

  const initOffset = useMemo(() => {
    const destCX = window.innerWidth  / 2;
    const destCY = window.innerHeight / 2;
    const srcCX  = sourceRect.left + sourceRect.width  / 2;
    const srcCY  = sourceRect.top  + sourceRect.height / 2;
    return { x: srcCX - destCX, y: srcCY - destCY, scale: sourceRect.width / CARD_W };
  }, [sourceRect]);

  useEffect(() => {
    // Double rAF ensures the initial translated/scaled position is painted
    // to the screen before the fly-in animation starts, preventing a 1-frame
    // flash where the card appears at full size in the center.
    let raf1: number, raf2: number;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setPhase("flying"));
    });
    const t1 = setTimeout(() => setPhase("flipping"), 420);
    const t2 = setTimeout(() => setPhase("ready"),    420 + 560);
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (phase !== "ready" || !cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    setMouse({
      x: Math.round(((e.clientX - r.left)  / r.width)  * 100),
      y: Math.round(((e.clientY - r.top)   / r.height) * 100),
    });
  }, [phase]);

  const handleMouseLeave = useCallback(() => setMouse({ x: 50, y: 50 }), []);

  const handleCardFlip = useCallback(() => {
    if (phase !== "ready") return;
    setIsUserFlipping(true);
    setFlipped((prev) => !prev);
    setTimeout(() => setIsUserFlipping(false), 520);
  }, [phase]);

  const positionerTransform  = phase === "init"
    ? `translate(${initOffset.x}px, ${initOffset.y}px) scale(${initOffset.scale})`
    : "translate(0,0) scale(1)";
  const positionerTransition = phase === "flying"
    ? "transform 0.42s cubic-bezier(0.34,1.56,0.64,1)"
    : "none";

  const tiltX = phase === "ready" && !isUserFlipping ? (mouse.y - 50) * 0.14 : 0;
  const tiltY = phase === "ready" && !isUserFlipping ? (mouse.x - 50) * -0.14 : 0;
  const flipperTransform =
    phase === "init" || phase === "flying" ? "rotateY(0deg)"
    : phase === "flipping"                 ? "rotateY(180deg)"
    : `rotateY(${(flipped ? 180 : 0) + tiltY}deg) rotateX(${tiltX}deg)`;
  const flipperTransition =
    phase === "flipping" ? "transform 0.56s cubic-bezier(0.4,0,0.2,1)"
    : phase === "ready"  ? (isUserFlipping ? "transform 0.52s cubic-bezier(0.4,0,0.2,1)" : "transform 0.08s ease-out")
    : "none";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        backgroundColor: phase === "init" ? "rgba(0,0,0,0)"  : "rgba(0,0,0,0.75)",
        backdropFilter:  phase === "init" ? "blur(0px)"      : "blur(6px)",
        transition: "background-color 0.35s ease, backdrop-filter 0.35s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{ transform: positionerTransform, transition: positionerTransition }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ perspective: "900px", width: CARD_W, height: CARD_H }}>
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              position: "relative",
              width: CARD_W, height: CARD_H,
              transformStyle: "preserve-3d",
              transform: flipperTransform,
              transition: flipperTransition,
              borderRadius: 16,
              boxShadow: RARITY_GLOW[rarity],
            }}
          >

            {/* ── FRONT FACE ─────────────────────────────────────────── */}
            <div style={{
              position: "absolute", inset: 0, backfaceVisibility: "hidden",
              borderRadius: 14, overflow: "hidden",
              border: cardBorder,
              background: "linear-gradient(160deg, #1a0e36 0%, #2D1B4E 100%)",
              ...(officeImageUrl ? {
                backgroundImage: `url(${officeImageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              } : {}),
            }}>
              {/* Subtle SEI circle decoration */}
              <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.07, pointerEvents: "none" }} aria-hidden>
                {[50, 90, 130].map((r) => (
                  <circle key={r} cx="110%" cy="50%" r={r} fill="none" stroke="#C8102E" strokeWidth="1" />
                ))}
              </svg>

              {/* Scrim */}
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.28)" }} />

              {/* Rank badges */}
              {(consultant.alltime_rank || consultant.monthly_rank) && (
                <div style={{ position: "absolute", top: 10, left: 10, zIndex: 2, display: "flex", flexDirection: "column", gap: 4 }}>
                  {consultant.alltime_rank && (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 4,
                      background: "rgba(10,6,24,0.78)", backdropFilter: "blur(6px)",
                      borderRadius: 5, padding: "3px 7px",
                      border: "1px solid rgba(251,191,36,0.35)",
                    }}>
                      <span style={{ fontSize: 10 }}>🏆</span>
                      <span style={{ fontSize: 9, fontWeight: 800, color: "#fbbf24", letterSpacing: "0.04em" }}>
                        #{consultant.alltime_rank} All Time
                      </span>
                    </div>
                  )}
                  {consultant.monthly_rank && (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 4,
                      background: "rgba(10,6,24,0.78)", backdropFilter: "blur(6px)",
                      borderRadius: 5, padding: "3px 7px",
                      border: "1px solid rgba(96,165,250,0.35)",
                    }}>
                      <span style={{ fontSize: 10 }}>📅</span>
                      <span style={{ fontSize: 9, fontWeight: 800, color: "#93c5fd", letterSpacing: "0.04em" }}>
                        #{consultant.monthly_rank} This Month
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Creator badge */}
              {consultant.is_creator && (
                <div style={{
                  position: "absolute", top: 10, right: 10, zIndex: 2,
                  display: "flex", alignItems: "center", gap: 4,
                  background: "rgba(10,6,24,0.88)", backdropFilter: "blur(6px)",
                  borderRadius: 5, padding: "4px 8px",
                  border: "1px solid rgba(251,191,36,0.7)",
                  boxShadow: "0 0 12px rgba(251,191,36,0.35)",
                }}>
                  <span style={{ fontSize: 11, lineHeight: 1, color: "#fbbf24" }}>♛</span>
                  <span style={{ fontSize: 9, fontWeight: 800, color: "#fbbf24", letterSpacing: "0.1em" }}>
                    CREATOR
                  </span>
                </div>
              )}

              {/* Circle profile photo — centered, shifted up */}
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: "24%" }}>
                <div style={{
                  width: 152, height: 152, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
                  ...photoRingStyle(rarity, RARITY_HEX[rarity]),
                  background: "#2D1B4E", position: "relative",
                }}>
                  {photo ? (
                    <Image src={photo} alt={fullName} fill sizes="152px" className="object-cover object-top" />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: RARITY_HEADER[rarity], color: "#fff", fontWeight: 900, fontSize: 28 }}>
                      {fullName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom gradient + name */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 55%, transparent 100%)",
                padding: "48px 16px 16px",
              }}>
                <p style={{ color: "#fff", fontWeight: 900, fontSize: 17, lineHeight: 1.2 }}>{fullName}</p>
                {consultant.title && <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 }}>{consultant.title}</p>}
              </div>
            </div>

            {/* ── BACK FACE (TCG info card) ──────────────────────────── */}
            <div style={{
              position: "absolute", inset: 0, backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              borderRadius: 14, overflow: "hidden",
              border: cardBorder,
              background: "#f8fafc",
              display: "flex", flexDirection: "column",
            }}>

              {/* Rarity-gradient header with circle photo */}
              <div style={{ background: RARITY_HEADER[rarity], padding: "12px", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

                  {/* Circle photo */}
                  <div style={{
                    width: 90, height: 90, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
                    ...photoRingStyle(rarity, RARITY_HEX[rarity]),
                    background: "#2D1B4E", position: "relative",
                  }}>
                    {photo ? (
                      <Image src={photo} alt={fullName} fill sizes="90px" className="object-cover object-center" />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.35)", color: "#fff", fontWeight: 900, fontSize: 24 }}>
                        {fullName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Identity + rarity badge */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 4, marginBottom: 3 }}>
                      <p style={{ color: "#fff", fontWeight: 900, fontSize: 13, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
                        {fullName}
                      </p>
                      <div style={{
                        background: "rgba(255,255,255,0.18)",
                        border: "1px solid rgba(255,255,255,0.35)",
                        color: "#fff",
                        fontSize: 8, fontWeight: 800,
                        textTransform: "uppercase", letterSpacing: "0.08em",
                        padding: "3px 7px", borderRadius: 4,
                        flexShrink: 0, lineHeight: 1.4,
                      }}>
                        {RARITY_LABELS[rarity]}
                      </div>
                    </div>
                    {(consultant.alltime_rank || consultant.monthly_rank || consultant.is_creator) && (
                      <div style={{ display: "flex", gap: 4, marginBottom: 3, flexWrap: "wrap" }}>
                        {consultant.is_creator && (
                          <span style={{
                            fontSize: 8, fontWeight: 800, padding: "2px 6px", borderRadius: 3,
                            background: "rgba(251,191,36,0.15)", color: "#fbbf24",
                            border: "1px solid rgba(251,191,36,0.55)",
                          }}>
                            ♛ Creator
                          </span>
                        )}
                        {consultant.alltime_rank && (
                          <span style={{
                            fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 3,
                            background: "rgba(251,191,36,0.18)", color: "#fbbf24",
                            border: "1px solid rgba(251,191,36,0.35)",
                          }}>
                            🏆 #{consultant.alltime_rank} All Time
                          </span>
                        )}
                        {consultant.monthly_rank && (
                          <span style={{
                            fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 3,
                            background: "rgba(96,165,250,0.18)", color: "#93c5fd",
                            border: "1px solid rgba(96,165,250,0.35)",
                          }}>
                            📅 #{consultant.monthly_rank} This Month
                          </span>
                        )}
                      </div>
                    )}
                    {consultant.title && (
                      <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 10, lineHeight: 1.35, marginBottom: 2 }}>
                        {consultant.title}
                      </p>
                    )}
                    {consultant.office && (
                      <p style={{ color: "rgba(255,255,255,0.50)", fontSize: 9, lineHeight: 1.35 }}>
                        {consultant.office}
                      </p>
                    )}
                  </div>

                </div>
              </div>

              {/* Rarity rule */}
              <div style={{ height: 1, background: `${rarityColor}55`, flexShrink: 0 }} />

              {/* Info content */}
              <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px 0", display: "flex", flexDirection: "column", gap: 7 }}>

                {/* Catch level */}
                {consultant.catch_level !== null && (
                  <div style={{ alignSelf: "flex-start" }}>
                    <span style={{
                      fontSize: 10, padding: "2px 8px", borderRadius: 99,
                      background: "#f1f5f9", border: "1px solid #e2e8f0",
                      color: "#475569", fontWeight: 600,
                    }}>
                      {CATCH_LEVEL_ICONS[consultant.catch_level]} {CATCH_LEVEL_LABELS[consultant.catch_level]} · +{XP_PER_LEVEL[consultant.catch_level as 1 | 2 | 3]} pts
                    </span>
                  </div>
                )}

                {/* Current client */}
                {consultant.current_client && (
                  <div>
                    <p style={LABEL_STYLE}>Current Client</p>
                    <span style={{
                      fontSize: 10, padding: "2px 8px", borderRadius: 99,
                      background: "rgba(200,16,46,0.07)", border: "1px solid rgba(200,16,46,0.20)",
                      color: "#C8102E", fontWeight: 600,
                    }}>
                      ● {consultant.current_client}
                    </span>
                  </div>
                )}

                {/* Past clients */}
                {consultant.past_clients && (
                  <div>
                    <p style={LABEL_STYLE}>Past Clients / Employers</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                      {consultant.past_clients.split(",").map((c) => c.trim()).filter(Boolean).map((client, i) => (
                        <span key={i} style={{
                          padding: "2px 7px", borderRadius: 99,
                          background: "rgba(45,27,78,0.05)", color: "#2D1B4E",
                          fontSize: 9, border: "1px solid rgba(45,27,78,0.14)",
                        }}>
                          {client}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preferred communication */}
                {consultant.preferred_comm && (
                  <div>
                    <p style={LABEL_STYLE}>Preferred Communication</p>
                    <span style={{
                      fontSize: 10, padding: "2px 8px", borderRadius: 99,
                      background: "rgba(45,27,78,0.07)", border: "1px solid rgba(45,27,78,0.14)",
                      color: "#2D1B4E", fontWeight: 600,
                    }}>
                      {COMM_ICONS[consultant.preferred_comm]} {consultant.preferred_comm}
                    </span>
                  </div>
                )}

                {/* Achievements */}
                {earnedBadges.length > 0 && (
                  <div>
                    <p style={LABEL_STYLE}>Achievements</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {earnedBadges.map((b) => (
                        <BadgeTooltip key={b.id} badge={b} />
                      ))}
                    </div>
                  </div>
                )}

                {/* What I can help with */}
                {skillList.length > 0 && (
                  <div>
                    <p style={LABEL_STYLE}>What I can help with!</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                      {skillList.map((skill, i) => (
                        <span key={i} style={{
                          padding: "2px 7px", borderRadius: 99,
                          background: "#eff6ff", color: "#1d4ed8",
                          fontSize: 9, border: "1px solid #bfdbfe",
                        }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Full profile link */}
              <div style={{ padding: "6px 12px 0", flexShrink: 0, textAlign: "right" }}>
                <Link
                  href={`/consultant/${consultant.id}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{ fontSize: 10, color: "#C8102E", fontWeight: 600, textDecoration: "none" }}
                >
                  Full profile →
                </Link>
              </div>

              {/* CatchButton or own-card note */}
              <div style={{ padding: "6px 12px 12px", borderTop: "1px solid #f1f5f9", flexShrink: 0 }}>
                {consultant.is_own_card ? (
                  <p style={{ textAlign: "center", fontSize: 11, color: "rgba(45,27,78,0.38)", fontStyle: "italic", padding: "5px 0" }}>
                    This is your card ✨
                  </p>
                ) : (
                  <CatchButton
                    consultantId={consultant.id}
                    initialLevel={consultant.catch_level as Level | null}
                  />
                )}
              </div>

              {/* Foil shimmer — full card back overlay */}
              <div style={{ position: "absolute", inset: 0, borderRadius: 14, pointerEvents: "none", ...foilStyle(rarity, mouse.x, mouse.y) }} />

            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 12 }}>
          {phase === "ready" && (
            <button
              onClick={(e) => { e.stopPropagation(); handleCardFlip(); }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.22)",
                color: "rgba(255,255,255,0.75)", borderRadius: 99,
                padding: "5px 13px 5px 9px", fontSize: 11, cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 15, lineHeight: 1 }}>↺</span> Flip
            </button>
          )}
          <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 11, userSelect: "none" }}>
            Click outside or Esc to close
          </p>
        </div>
      </div>
    </div>
  );
}
