"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import CardModal from "../CardModal";
import type { ConsultantRow } from "@/lib/types";
import { getRarity, type Rarity } from "@/lib/xp";
import { pickPhoto } from "@/lib/cards";

type AnimState = "idle" | "exit-fwd" | "exit-back" | "enter-fwd" | "enter-back";

const CARDS_PER_PAGE = 9;

const MINI_BORDER: Record<Rarity, string> = {
  common:    "1px solid rgba(229,231,235,0.3)",
  uncommon:  "1.5px solid #4ade80",
  rare:      "1.5px solid #60a5fa",
  epic:      "2px solid #c084fc",
  legendary: "2px solid #fbbf24",
};

const MINI_GLOW: Record<Rarity, string> = {
  common:    "0 2px 6px rgba(0,0,0,0.6)",
  uncommon:  "0 0 7px 1px rgba(74,222,128,0.4), 0 2px 6px rgba(0,0,0,0.5)",
  rare:      "0 0 7px 2px rgba(96,165,250,0.45), 0 2px 6px rgba(0,0,0,0.5)",
  epic:      "0 0 10px 3px rgba(192,132,252,0.5), 0 2px 6px rgba(0,0,0,0.5)",
  legendary: "0 0 14px 4px rgba(251,191,36,0.55), 0 2px 6px rgba(0,0,0,0.5)",
};

const AVATAR_COLORS = [
  "bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-orange-500",
  "bg-pink-500", "bg-teal-500", "bg-indigo-500", "bg-rose-500",
];

function MiniAvatar({ name }: { name: string }) {
  const initials = name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div className={`w-full h-full flex items-center justify-center text-white font-bold text-lg ${color}`}>
      {initials}
    </div>
  );
}

interface Props {
  consultants: ConsultantRow[];
  totalRoster: number;
  rosterSize: number;
}

export default function CollectionBinder({ consultants, totalRoster, rosterSize }: Props) {
  const totalPages = Math.max(1, Math.ceil(consultants.length / CARDS_PER_PAGE));
  const [page, setPage] = useState(0);
  const [anim, setAnim] = useState<AnimState>("idle");
  const [selectedCard, setSelectedCard] = useState<{ consultant: ConsultantRow; rect: DOMRect } | null>(null);

  const navigate = useCallback(
    (dir: "fwd" | "back") => {
      if (anim !== "idle") return;
      if (dir === "fwd" && page >= totalPages - 1) return;
      if (dir === "back" && page <= 0) return;

      setAnim(dir === "fwd" ? "exit-fwd" : "exit-back");
      setTimeout(() => {
        setPage((p) => p + (dir === "fwd" ? 1 : -1));
        setAnim(dir === "fwd" ? "enter-fwd" : "enter-back");
        setTimeout(() => setAnim("idle"), 280);
      }, 220);
    },
    [anim, page, totalPages]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (selectedCard) return;
      if (e.key === "ArrowRight") navigate("fwd");
      if (e.key === "ArrowLeft") navigate("back");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, selectedCard]);

  // Page transform for the flip effect
  const pageStyle = (() => {
    const base = { transition: "transform 0.22s ease, opacity 0.22s ease", transformOrigin: "left center" };
    if (anim === "exit-fwd")   return { ...base, transform: "translateX(-32px) rotateY(-6deg)", opacity: 0 };
    if (anim === "exit-back")  return { ...base, transform: "translateX(32px)  rotateY(6deg)",  opacity: 0 };
    if (anim === "enter-fwd")  return { ...base, transform: "translateX(32px)  rotateY(6deg)",  opacity: 0, transition: "none" };
    if (anim === "enter-back") return { ...base, transform: "translateX(-32px) rotateY(-6deg)", opacity: 0, transition: "none" };
    return { ...base, transform: "translateX(0) rotateY(0deg)", opacity: 1 };
  })();

  // Trigger the enter animation a frame after setting to enter state
  useEffect(() => {
    if (anim === "enter-fwd" || anim === "enter-back") {
      const id = requestAnimationFrame(() => {
        // force the transition to play by letting the browser paint the "start" frame first
        requestAnimationFrame(() => {
          setAnim("idle");
        });
      });
      return () => cancelAnimationFrame(id);
    }
  }, [anim]);

  const slots: (ConsultantRow | null)[] = Array.from({ length: CARDS_PER_PAGE }, (_, i) => {
    const idx = page * CARDS_PER_PAGE + i;
    return idx < consultants.length ? consultants[idx] : null;
  });

  // Office label for current page
  const pageOffices = [...new Set(slots.filter(Boolean).map((c) => c!.office).filter(Boolean))];
  const officeLabel = pageOffices.join(" · ");

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Binder */}
      <div
        className="w-full bg-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
        style={{ maxWidth: 660, perspective: "1400px" }}
      >
        {/* Top label strip */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-zinc-900/80 border-b border-zinc-700">
          <span className="text-xs text-zinc-500 font-medium tracking-wide uppercase">
            {officeLabel || "Collection"}
          </span>
          <span className="text-xs text-zinc-500 tabular-nums">
            {consultants.length} / {totalRoster}
          </span>
        </div>

        <div className="flex">
          {/* Binder spine with rings */}
          <div className="flex flex-col items-center justify-evenly py-8 bg-zinc-900 w-11 shrink-0 border-r border-zinc-700">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full border-2 border-zinc-500"
                style={{
                  background: "radial-gradient(circle at 35% 35%, #52525b, #18181b)",
                  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.06)",
                }}
              />
            ))}
          </div>

          {/* Page */}
          <div className="flex-1 p-5" style={{ perspective: "900px" }}>
            <div style={pageStyle}>
              <div className="grid grid-cols-3 gap-3">
                {slots.map((consultant, i) =>
                  consultant ? (
                    <FilledSlot
                      key={consultant.id}
                      consultant={consultant}
                      rosterSize={rosterSize}
                      onOpen={(c, rect) => setSelectedCard({ consultant: c, rect })}
                    />
                  ) : (
                    <EmptySlot key={`empty-${i}`} />
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom nav strip */}
        <div className="flex items-center justify-between px-5 py-3 bg-zinc-900/80 border-t border-zinc-700">
          <button
            onClick={() => navigate("back")}
            disabled={page === 0 || anim !== "idle"}
            className="w-9 h-9 flex items-center justify-center rounded-full text-xl text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-25 disabled:cursor-default transition-colors"
            aria-label="Previous page"
          >
            ‹
          </button>
          <p className="text-xs text-zinc-400 tabular-nums select-none">
            Page {page + 1} of {totalPages}
          </p>
          <button
            onClick={() => navigate("fwd")}
            disabled={page >= totalPages - 1 || anim !== "idle"}
            className="w-9 h-9 flex items-center justify-center rounded-full text-xl text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-25 disabled:cursor-default transition-colors"
            aria-label="Next page"
          >
            ›
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400 select-none">← → arrow keys to flip pages</p>

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

function FilledSlot({
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

  return (
    <div
      className="relative cursor-pointer rounded-xl overflow-hidden group"
      style={{
        aspectRatio: "5 / 7",
        border: MINI_BORDER[rarity],
        boxShadow: MINI_GLOW[rarity],
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
      onClick={(e) => onOpen(consultant, e.currentTarget.getBoundingClientRect())}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "scale(1.06)";
        (e.currentTarget as HTMLElement).style.zIndex = "10";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "scale(1)";
        (e.currentTarget as HTMLElement).style.zIndex = "auto";
      }}
    >
      {/* Photo */}
      <div className="absolute inset-0 bg-zinc-700">
        {photo ? (
          <Image src={photo} alt={fullName} fill sizes="200px" className="object-cover object-top" />
        ) : (
          <MiniAvatar name={fullName} />
        )}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

      {/* Name label */}
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <p className="text-white text-[10px] font-semibold leading-tight truncate drop-shadow">
          {fullName}
        </p>
        {consultant.office && (
          <p className="text-white/50 text-[9px] leading-tight truncate">{consultant.office}</p>
        )}
      </div>

      {/* Rarity shimmer on hover for legendary */}
      {rarity === "legendary" && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl"
          style={{
            background: "linear-gradient(135deg, rgba(255,200,0,0.15), rgba(255,100,0,0.1), rgba(255,200,0,0.15))",
            mixBlendMode: "screen",
          }}
        />
      )}
    </div>
  );
}

function EmptySlot() {
  return (
    <div
      className="rounded-xl flex items-center justify-center select-none"
      style={{
        aspectRatio: "5 / 7",
        background: "rgba(39,39,42,0.6)",
        border: "1px dashed rgba(82,82,91,0.5)",
      }}
    >
      <span className="text-zinc-600 text-3xl font-light">?</span>
    </div>
  );
}
