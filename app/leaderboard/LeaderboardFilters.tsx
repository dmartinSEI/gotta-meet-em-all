"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function LeaderboardFilters({ offices }: { offices: string[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const period = params.get("period") ?? "all";
  const office = params.get("office") ?? "";

  function update(key: string, value: string) {
    const p = new URLSearchParams(params.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    router.push(`/leaderboard?${p.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 mb-7">
      {/* Period toggle */}
      <div className="flex rounded-xl overflow-hidden" style={{ border: "1.5px solid rgba(45,27,78,0.12)" }}>
        {(["all", "month"] as const).map((val) => (
          <button
            key={val}
            onClick={() => update("period", val === "all" ? "" : val)}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={period === val
              ? { background: "#2D1B4E", color: "#fff" }
              : { background: "#fff", color: "rgba(45,27,78,0.50)" }
            }
          >
            {val === "all" ? "All Time" : "This Month"}
          </button>
        ))}
      </div>

      {/* Office filter */}
      <div className="relative">
        <select
          value={office}
          onChange={(e) => update("office", e.target.value)}
          className="text-sm rounded-xl pl-3 pr-8 py-2 appearance-none cursor-pointer transition-colors"
          style={{
            border: "1.5px solid rgba(45,27,78,0.12)",
            background: office ? "#2D1B4E" : "#fff",
            color: office ? "#fff" : "rgba(45,27,78,0.55)",
          }}
        >
          <option value="">All Offices</option>
          {offices.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        {/* chevron */}
        <svg
          viewBox="0 0 12 12" width="10" height="10"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
          fill="none" stroke={office ? "#fff" : "rgba(45,27,78,0.40)"} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M2 4l4 4 4-4" />
        </svg>
      </div>

      {/* Active filter pill */}
      {(period !== "all" || office) && (
        <button
          onClick={() => router.push("/leaderboard")}
          className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
          style={{ background: "rgba(200,16,46,0.08)", color: "#C8102E", border: "1px solid rgba(200,16,46,0.20)" }}
        >
          Clear filters ×
        </button>
      )}
    </div>
  );
}
