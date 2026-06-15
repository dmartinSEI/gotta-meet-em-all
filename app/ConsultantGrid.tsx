"use client";

import { useMemo, useState } from "react";
import CatchButton from "./CatchButton";
import type { ConsultantRow } from "@/lib/types";

type StatusFilter = "all" | "unmet" | "met";

export default function ConsultantGrid({ consultants }: { consultants: ConsultantRow[] }) {
  const [search, setSearch] = useState("");
  const [officeFilter, setOfficeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const offices = useMemo(
    () => ["all", ...Array.from(new Set(consultants.map((c) => c.office).filter(Boolean))).sort()],
    [consultants]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return consultants.filter((c) => {
      if (q && !`${c.first_name} ${c.last_name}`.toLowerCase().includes(q)) return false;
      if (officeFilter !== "all" && c.office !== officeFilter) return false;
      if (statusFilter === "met" && !c.is_caught) return false;
      if (statusFilter === "unmet" && c.is_caught) return false;
      return true;
    });
  }, [consultants, search, officeFilter, statusFilter]);

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
        <select
          value={officeFilter}
          onChange={(e) => setOfficeFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {offices.map((o) => (
            <option key={o} value={o}>
              {o === "all" ? "All offices" : o}
            </option>
          ))}
        </select>
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
            const isOwnCard = c.is_own_card;
            const skillList = c.skills
              ? c.skills.split(",").map((s) => s.trim()).filter(Boolean)
              : [];
            return (
              <div
                key={c.id}
                className={`flex flex-col border rounded-xl p-4 gap-1 bg-white shadow-sm ${isOwnCard ? "ring-2 ring-blue-400" : ""}`}
              >
                <div className="flex items-start justify-between gap-1">
                  <p className="font-semibold text-gray-900">
                    {c.first_name} {c.last_name}
                  </p>
                  {isOwnCard && (
                    <a
                      href="/profile"
                      className="text-xs text-blue-500 hover:text-blue-700 shrink-0"
                    >
                      Edit
                    </a>
                  )}
                </div>
                {c.title && <p className="text-sm text-gray-500">{c.title}</p>}
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
                <div className="mt-3">
                  <CatchButton consultantId={c.id} initialCaught={c.is_caught} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
