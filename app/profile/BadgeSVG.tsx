import type { BadgeInfo } from "@/lib/types";

export type BadgeItem = BadgeInfo & { earnedAt: string | null };

// ── Shape paths (viewBox 0 0 100 100) ────────────────────────────────────────

const SHAPE_PATH: Record<string, string> = {
  octagon:      "M 30,4 L 70,4 L 96,30 L 96,70 L 70,96 L 30,96 L 4,70 L 4,30 Z",
  gem:          "M 50,4 L 96,50 L 50,96 L 4,50 Z",
  hexagon:      "M 50,4 L 91,27 L 91,73 L 50,96 L 9,73 L 9,27 Z",
  pentagon:     "M 50,4 L 96,37 L 78,90 L 22,90 L 4,37 Z",
  star:         "M 50,6 L 61,35 L 92,36 L 68,56 L 76,86 L 50,69 L 24,86 L 32,56 L 8,36 L 39,35 Z",
  rounddiamond: "M 50,4 Q 70,4 96,50 Q 70,96 50,96 Q 30,96 4,50 Q 30,4 50,4 Z",
  burst:        "M 50,6 L 61,24 L 81,19 L 76,39 L 94,50 L 76,61 L 81,81 L 61,76 L 50,94 L 39,76 L 19,81 L 24,61 L 6,50 L 24,39 L 19,19 L 39,24 Z",
  shield:       "M 12,8 L 88,8 L 88,56 Q 88,86 50,96 Q 12,86 12,56 Z",
  crown:        "M 8,88 V 52 L 28,68 L 50,16 L 72,68 L 92,52 V 88 Z",
};

const CATEGORY_SHAPE: Record<string, string> = {
  Meetings:    "octagon",
  Depth:       "gem",
  Exploration: "hexagon",
  Bounties:    "pentagon",
  Recognition: "star",
  Reciprocity: "rounddiamond",
  Consistency: "burst",
  Prestige:    "shield",
  Rank:        "crown",
};

// ── Colors ───────────────────────────────────────────────────────────────────

type ColorSet = { light: string; main: string; dark: string };

const CATEGORY_COLOR: Record<string, ColorSet> = {
  Meetings:    { light: "#93c5fd", main: "#3b82f6", dark: "#1e3a8a" },
  Depth:       { light: "#c4b5fd", main: "#7c3aed", dark: "#2e1065" },
  Exploration: { light: "#6ee7b7", main: "#10b981", dark: "#064e3b" },
  Bounties:    { light: "#fdba74", main: "#f97316", dark: "#7c2d12" },
  Recognition: { light: "#fde047", main: "#ca8a04", dark: "#713f12" },
  Reciprocity: { light: "#7dd3fc", main: "#0891b2", dark: "#0c4a6e" },
  Consistency: { light: "#94a3b8", main: "#475569", dark: "#0f172a" },
  Prestige:    { light: "#fcd34d", main: "#d97706", dark: "#78350f" },
  Rank:        { light: "#fca5a5", main: "#C8102E", dark: "#450a0a" },
};

// Per-badge overrides for top-tier / prestige badges
const BADGE_COLOR: Record<string, ColorSet> = {
  century_club:       { light: "#a5b4fc", main: "#4338ca", dark: "#1e1b4b" },
  inner_circle:       { light: "#818cf8", main: "#3730a3", dark: "#1e1b4b" },
  everybody_knows:    { light: "#c4b5fd", main: "#6d28d9", dark: "#2e1065" },
  iron_bond:          { light: "#a78bfa", main: "#4c1d95", dark: "#1e0038" },
  living_legend:      { light: "#a78bfa", main: "#3b0764", dark: "#0d001a" },
  world_traveler:     { light: "#5eead4", main: "#0f766e", dark: "#042f2e" },
  recognized_50:      { light: "#fef3c7", main: "#d97706", dark: "#451a03" },
  recognized_100:     { light: "#e2e8f0", main: "#64748b", dark: "#0f172a" },
  mutual_50:          { light: "#38bdf8", main: "#075985", dark: "#082f49" },
  iron_will:          { light: "#475569", main: "#1e293b", dark: "#020617" },
  dynasty:            { light: "#fde68a", main: "#92400e", dark: "#451a03" },
  untouchable:        { light: "#fef3c7", main: "#b45309", dark: "#3b0000" },
  rank_distinguished: { light: "#fca5a5", main: "#7f1d1d", dark: "#3b0000" },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function BadgeSVG({ badge, size = 72 }: { badge: BadgeItem; size?: number }) {
  const earned    = badge.earnedAt !== null;
  const shape     = CATEGORY_SHAPE[badge.category] ?? "octagon";
  const path      = SHAPE_PATH[shape];
  const isRainbow = badge.id === "met_em_all";
  const colors    = BADGE_COLOR[badge.id] ?? CATEGORY_COLOR[badge.category] ?? CATEGORY_COLOR.Rank;
  const gradId    = `g-${badge.id}`;
  const clipId    = `c-${badge.id}`;
  const glowColor = isRainbow ? "#a78bfa" : colors.main;

  return (
    <div style={{ position: "relative", width: size, height: size, display: "inline-block", flexShrink: 0 }}>
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        style={{
          display: "block",
          filter: earned
            ? `drop-shadow(0 0 ${Math.round(size * 0.09)}px ${glowColor}99)`
            : "grayscale(1)",
          opacity: earned ? 1 : 0.35,
          transition: "filter 0.2s, opacity 0.2s",
        }}
        aria-hidden="true"
      >
        <defs>
          {isRainbow ? (
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%"   stopColor="#f43f5e" />
              <stop offset="20%"  stopColor="#f97316" />
              <stop offset="40%"  stopColor="#eab308" />
              <stop offset="65%"  stopColor="#22c55e" />
              <stop offset="85%"  stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          ) : (
            <linearGradient id={gradId} x1="30%" y1="0%" x2="70%" y2="100%">
              <stop offset="0%"   stopColor={colors.light} />
              <stop offset="55%"  stopColor={colors.main}  />
              <stop offset="100%" stopColor={colors.dark}  />
            </linearGradient>
          )}
          <clipPath id={clipId}>
            <path d={path} />
          </clipPath>
        </defs>

        {/* Gold metallic outer border */}
        <path
          d={path}
          fill="none"
          stroke={isRainbow ? "#d4a017" : "#c8960c"}
          strokeWidth={7}
          strokeLinejoin="round"
        />

        {/* Gem fill */}
        <path d={path} fill={`url(#${gradId})`} />

        {/* Top-left specular highlight */}
        <ellipse
          cx="37" cy="29"
          rx="20" ry="13"
          fill="white"
          opacity="0.22"
          clipPath={`url(#${clipId})`}
        />

        {/* Bottom-right shadow for depth */}
        <ellipse
          cx="64" cy="72"
          rx="18" ry="11"
          fill="black"
          opacity="0.14"
          clipPath={`url(#${clipId})`}
        />
      </svg>

      {/* Emoji rendered in HTML — avoids SVG text/font inconsistencies */}
      <span
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -52%)",
          fontSize: Math.round(size * 0.33),
          lineHeight: 1,
          display: "block",
          pointerEvents: "none",
          userSelect: "none",
          filter: earned ? "none" : "grayscale(1)",
        }}
        aria-hidden="true"
      >
        {badge.icon}
      </span>
    </div>
  );
}
