import { RARITY_LABELS, RARITY_HEX, getRarityThresholds, type Rarity } from "@/lib/xp";

const TIER_ORDER: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary"];

const TIER_DESC: Record<Rarity, string> = {
  common:    "Your starting rank — you're on your way.",
  uncommon:  "You've started making connections across SEI.",
  rare:      "A well-connected professional with a solid network across SEI.",
  epic:      "Widely recognized — a go-to collaborator at SEI.",
  legendary: "Top of the network — you've met everyone at SEI.",
};

interface Props {
  totalXp: number;
  totalRoster: number;
  caughtCount: number;
  recognizedByCount: number;
  rarity: Rarity;
}

export default function StandingSection({ totalXp, totalRoster, caughtCount, recognizedByCount, rarity }: Props) {
  const thresholds  = getRarityThresholds(totalRoster);
  const currentIdx  = TIER_ORDER.indexOf(rarity);
  const nextRarity  = TIER_ORDER[currentIdx + 1] ?? null;
  const prevFloor   = thresholds[rarity];
  const nextFloor   = nextRarity ? thresholds[nextRarity] : null;
  const progressPct = nextFloor
    ? Math.min(100, Math.round(((totalXp - prevFloor) / (nextFloor - prevFloor)) * 100))
    : 100;
  const ptsToNext   = nextFloor ? Math.max(0, nextFloor - totalXp) : 0;
  const rarityHex   = RARITY_HEX[rarity];

  return (
    <div>
      <p className="text-[9px] font-black tracking-[0.2em] uppercase text-[#2D1B4E]/40 mb-5">
        Your Standing
      </p>

      {/* Current rank hero row */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="font-black text-2xl leading-none mb-1" style={{ color: rarityHex }}>
            {RARITY_LABELS[rarity]}
          </p>
          <p className="text-sm font-medium" style={{ color: "rgba(45,27,78,0.55)" }}>
            {TIER_DESC[rarity]}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-black tabular-nums text-xl leading-none text-[#2D1B4E] mb-0.5">
            {totalXp.toLocaleString()}
          </p>
          <p style={{ fontSize: 10, color: "rgba(45,27,78,0.38)" }}>Meet Points</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-5 mb-6">
        <div>
          <p className="font-black tabular-nums text-lg leading-none text-[#2D1B4E]">{caughtCount}</p>
          <p style={{ fontSize: 10, color: "rgba(45,27,78,0.38)", marginTop: 2 }}>colleagues met</p>
        </div>
        <div style={{ width: 1, background: "rgba(45,27,78,0.08)" }} />
        <div>
          <p className="font-black tabular-nums text-lg leading-none text-[#2D1B4E]">{recognizedByCount}</p>
          <p style={{ fontSize: 10, color: "rgba(45,27,78,0.38)", marginTop: 2 }}>recognized by</p>
        </div>
      </div>

      {/* Progress to next tier */}
      {nextRarity ? (
        <div className="mb-7 p-4 rounded-xl" style={{ background: "rgba(45,27,78,0.03)", border: "1px solid rgba(45,27,78,0.07)" }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-[#2D1B4E]">
              Progress to <span style={{ color: RARITY_HEX[nextRarity] }}>{RARITY_LABELS[nextRarity]}</span>
            </p>
            <p className="text-xs tabular-nums" style={{ color: "rgba(45,27,78,0.45)" }}>
              {ptsToNext.toLocaleString()} pts to go
            </p>
          </div>
          <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: "rgba(45,27,78,0.08)" }}>
            <div
              style={{
                height: "100%",
                width: `${progressPct}%`,
                background: rarityHex,
                borderRadius: "9999px",
                transition: "width 0.5s ease",
              }}
            />
          </div>
          <p className="text-right mt-1" style={{ fontSize: 10, color: "rgba(45,27,78,0.35)" }}>
            {totalXp.toLocaleString()} / {nextFloor!.toLocaleString()} pts
          </p>
        </div>
      ) : (
        <div className="mb-7 p-4 rounded-xl text-center" style={{ background: `${rarityHex}12`, border: `1px solid ${rarityHex}33` }}>
          <p className="font-bold text-sm" style={{ color: rarityHex }}>
            🏆 You&apos;ve reached the top rank — Distinguished
          </p>
          <p className="text-xs mt-1" style={{ color: "rgba(45,27,78,0.45)" }}>
            You&apos;ve collaborated with colleagues across the entire firm.
          </p>
        </div>
      )}

      {/* Rank ladder */}
      <div className="mb-7">
        <p className="text-[9px] font-black tracking-[0.15em] uppercase mb-3" style={{ color: "rgba(45,27,78,0.30)" }}>
          Rank Tiers
        </p>
        <div className="space-y-1">
          {[...TIER_ORDER].reverse().map((tier, i) => {
            const isCurrent  = tier === rarity;
            const isPast     = TIER_ORDER.indexOf(tier) < currentIdx;
            const tierHex    = RARITY_HEX[tier];
            const threshold  = thresholds[tier];

            return (
              <div
                key={tier}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
                style={isCurrent
                  ? { background: `${tierHex}12`, border: `1px solid ${tierHex}33` }
                  : { border: "1px solid transparent" }
                }
              >
                {/* Color dot */}
                <div
                  style={{
                    width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                    background: isPast || isCurrent ? tierHex : "transparent",
                    border: `2px solid ${isPast || isCurrent ? tierHex : "rgba(45,27,78,0.18)"}`,
                  }}
                />

                {/* Tier name */}
                <p
                  className="font-bold text-sm flex-1"
                  style={{ color: isCurrent ? tierHex : isPast ? "#2D1B4E" : "rgba(45,27,78,0.35)" }}
                >
                  {RARITY_LABELS[tier]}
                  {isCurrent && (
                    <span className="ml-2 text-[9px] font-black uppercase tracking-widest" style={{ color: tierHex }}>
                      ← You
                    </span>
                  )}
                </p>

                {/* Threshold */}
                <p
                  className="tabular-nums text-xs"
                  style={{ color: isCurrent ? "rgba(45,27,78,0.55)" : isPast ? "rgba(45,27,78,0.35)" : "rgba(45,27,78,0.22)" }}
                >
                  {threshold === 0 ? "Starting rank" : `${threshold.toLocaleString()} pts`}
                </p>

                {/* Past indicator */}
                {isPast && (
                  <span style={{ fontSize: 11, color: "#22c55e" }}>✓</span>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-2.5 text-[10px]" style={{ color: "rgba(45,27,78,0.30)" }}>
          Thresholds scale with the roster — currently based on {totalRoster} consultants.
        </p>
      </div>

    </div>
  );
}
