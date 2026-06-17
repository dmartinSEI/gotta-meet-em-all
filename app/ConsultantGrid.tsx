"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import CatchButton from "./CatchButton";
import CardModal from "./CardModal";
import type { ConsultantRow } from "@/lib/types";
import { RARITY_STYLES } from "@/lib/xp";
import type { Rarity } from "@/lib/xp";

type StatusFilter = "all" | "unmet" | "met";
type Level = 1 | 2 | 3;

const AVATAR_COLORS = [
  "bg-blue-400", "bg-purple-400", "bg-green-400", "bg-orange-400",
  "bg-pink-400", "bg-teal-400", "bg-indigo-400", "bg-rose-400",
];

function InitialsAvatar({ name }: { name: string }) {
  const initials = name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div className={`w-full h-full flex items-center justify-center text-white font-bold text-3xl ${color}`}>
      {initials}
    </div>
  );
}

function pickPhoto(c: ConsultantRow): string {
  const level = c.catch_level as Level | null;
  if (level === 3 && c.photo_url_l3) return c.photo_url_l3;
  if (level && level >= 2 && c.photo_url_l2) return c.photo_url_l2;
  if (level && level >= 1 && c.photo_url_l1) return c.photo_url_l1;
  return c.photo_url;
}

export default function ConsultantGrid({
  consultants,
  rosterSize: _rosterSize,
  viewerRarity,
}: {
  consultants: ConsultantRow[];
  rosterSize: number;
  viewerRarity: Rarity;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedCard, setSelectedCard] = useState<{ consultant: ConsultantRow; rect: DOMRect } | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return consultants.filter((c) => {
      if (q && !`${c.first_name} ${c.last_name}`.toLowerCase().includes(q)) return false;
      if (statusFilter === "met" && c.catch_level === null) return false;
      if (statusFilter === "unmet" && c.catch_level !== null) return false;
      return true;
    });
  }, [consultants, search, statusFilter]);

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="search"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex rounded-lg border overflow-hidden text-sm">
          {(["all", "unmet", "met"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 capitalize transition-colors ${
                statusFilter === s
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-4">
        Showing {filtered.length} of {consultants.length}
      </p>

      {filtered.length === 0 ? (
        <p className="text-gray-400 text-sm py-12 text-center">No consultants match your filters.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((c) => {
            const fullName = `${c.first_name} ${c.last_name}`;
            const photo = pickPhoto(c);
            const skillList = c.skills
              ? c.skills.split(",").map((s) => s.trim()).filter(Boolean)
              : [];
            const cardBorder = c.is_own_card
              ? RARITY_STYLES[viewerRarity]
              : "border-gray-200";

            return (
              <div
                key={c.id}
                onClick={(e) => setSelectedCard({ consultant: c, rect: e.currentTarget.getBoundingClientRect() })}
                className={`flex flex-col rounded-xl overflow-hidden bg-white shadow-sm border transition-shadow hover:shadow-md cursor-pointer ${cardBorder} ${
                  c.catch_level !== null && !c.is_own_card ? "opacity-80" : ""
                }`}
              >
                {/* Portrait */}
                <div className="relative w-full aspect-[4/5] bg-gray-100 overflow-hidden">
                  {photo ? (
                    <Image
                      src={photo}
                      alt={fullName}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover object-top"
                    />
                  ) : (
                    <InitialsAvatar name={fullName} />
                  )}
                  {c.catch_level !== null && (
                    <div className="absolute inset-0 bg-black/10 flex items-end justify-end p-2">
                      <span className="text-white text-xs font-bold bg-black/40 rounded-full px-2 py-0.5">
                        Met ✓
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-col gap-1 p-3 flex-1">
                  <div className="flex items-start justify-between gap-1">
                    <p className="font-semibold text-gray-900 leading-tight">{fullName}</p>
                    {c.is_own_card && (
                      <a href="/profile" className="text-xs text-blue-500 hover:text-blue-700 shrink-0">
                        Edit
                      </a>
                    )}
                  </div>
                  {c.title && <p className="text-xs text-gray-500">{c.title}</p>}
                  {c.office && <p className="text-xs text-gray-400">{c.office}</p>}
                  {skillList.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {skillList.slice(0, 3).map((skill, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100"
                        >
                          {skill}
                        </span>
                      ))}
                      {skillList.length > 3 && (
                        <span className="px-1.5 py-0.5 text-gray-400 text-xs">
                          +{skillList.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                  <div className="mt-auto pt-2" onClick={(e) => e.stopPropagation()}>
                    <CatchButton
                      consultantId={c.id}
                      initialLevel={(c.catch_level as Level | null)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedCard && (
        <CardModal
          consultant={selectedCard.consultant}
          sourceRect={selectedCard.rect}
          viewerRarity={viewerRarity}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </div>
  );
}
