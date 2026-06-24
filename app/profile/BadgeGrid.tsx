import type { BadgeInfo } from "@/lib/types";

type BadgeItem = BadgeInfo & { earnedAt: string | null };

const CATEGORY_COLOR: Record<string, string> = {
  Meetings:    "#60a5fa",
  Depth:       "#c084fc",
  Exploration: "#34d399",
  Bounties:    "#fb923c",
  Recognition: "#fbbf24",
  Rank:        "#C8102E",
};

export default function BadgeGrid({ badgeList }: { badgeList: BadgeItem[] }) {
  const earnedCount = badgeList.filter((b) => b.earnedAt !== null).length;

  const categories: string[] = [];
  const byCategory: Record<string, BadgeItem[]> = {};
  for (const badge of badgeList) {
    if (!byCategory[badge.category]) {
      categories.push(badge.category);
      byCategory[badge.category] = [];
    }
    byCategory[badge.category].push(badge);
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(45,27,78,0.08)" }}>

      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between bg-white"
           style={{ borderBottom: "1px solid rgba(45,27,78,0.08)" }}>
        <p className="text-[9px] font-black tracking-[0.2em] uppercase text-[#2D1B4E]/40">
          Achievements
        </p>
        <span className="text-xs font-semibold tabular-nums" style={{ color: "rgba(45,27,78,0.38)" }}>
          {earnedCount} / {badgeList.length} earned
        </span>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2"
           style={{ gap: 1, background: "rgba(45,27,78,0.07)" }}>
        {categories.map((category) => {
          const badges = byCategory[category];
          const earned = badges.filter((b) => b.earnedAt !== null).length;
          const color  = CATEGORY_COLOR[category] ?? "#2D1B4E";

          return (
            <div key={category} className="bg-white flex flex-col">

              {/* Category header */}
              <div className="px-4 py-2.5 flex items-center justify-between shrink-0"
                   style={{
                     borderBottom: "1px solid rgba(45,27,78,0.06)",
                     borderLeft: `3px solid ${color}`,
                   }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color }}>
                  {category}
                </p>
                <span className="text-[10px] tabular-nums" style={{ color: "rgba(45,27,78,0.35)" }}>
                  {earned}/{badges.length}
                </span>
              </div>

              {/* Badge rows */}
              <div className="flex flex-col">
                {badges.map((badge, i) => {
                  const isEarned = badge.earnedAt !== null;
                  return (
                    <div
                      key={badge.id}
                      className="flex items-center gap-3 px-4 py-2.5"
                      style={{
                        borderTop: i > 0 ? "1px solid rgba(45,27,78,0.05)" : undefined,
                        opacity: isEarned ? 1 : 0.42,
                      }}
                    >
                      <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0, filter: isEarned ? "none" : "grayscale(1)" }}>
                        {badge.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#2D1B4E] leading-tight">
                          {badge.name}
                        </p>
                        <p className="text-[11px] mt-0.5 leading-snug" style={{ color: "rgba(45,27,78,0.45)" }}>
                          {badge.description}
                        </p>
                      </div>
                      {isEarned ? (
                        <div className="shrink-0 text-right">
                          <p style={{ fontSize: 11, fontWeight: 700, color: "#22c55e" }}>✓</p>
                          <p className="text-[10px]" style={{ color: "rgba(45,27,78,0.35)" }}>
                            {new Date(badge.earnedAt!).toLocaleDateString("en-US", {
                              month: "short", day: "numeric", year: "numeric",
                            })}
                          </p>
                        </div>
                      ) : (
                        <span style={{ fontSize: 14, color: "rgba(45,27,78,0.18)", flexShrink: 0 }}>—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
