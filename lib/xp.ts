export const XP_PER_LEVEL = { 1: 10, 2: 25, 3: 50 } as const;

export const RARITY_HEX: Record<string, string> = {
  common:    "#d1d5db",
  uncommon:  "#4ade80",
  rare:      "#60a5fa",
  epic:      "#c084fc",
  legendary: "#fbbf24",
};

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export const RARITY_LABELS: Record<Rarity, string> = {
  common:    "Rising",
  uncommon:  "Connected",
  rare:      "Established",
  epic:      "Influential",
  legendary: "Distinguished",
};

// Legendary floor = every consultant Delivered with (level 3, 50 pts each)
// Offices are cleared at ~Established; cross-office catches are needed for Influential+
export function getRarityThresholds(rosterSize: number): Record<Rarity, number> {
  const floor = rosterSize * XP_PER_LEVEL[3];
  return {
    common:    0,
    uncommon:  Math.round(floor * 0.042),
    rare:      Math.round(floor * 0.167),
    epic:      Math.round(floor * 0.417),
    legendary: floor,
  };
}

export function getRarity(xp: number, rosterSize: number): Rarity {
  if (rosterSize === 0 || xp === 0) return "common";
  const t = getRarityThresholds(rosterSize);
  if (xp >= t.legendary) return "legendary";
  if (xp >= t.epic)      return "epic";
  if (xp >= t.rare)      return "rare";
  if (xp >= t.uncommon)  return "uncommon";
  return "common";
}

export const RARITY_HEADER: Record<Rarity, string> = {
  common:    "linear-gradient(135deg, #374151 0%, #1f2937 100%)",
  uncommon:  "linear-gradient(135deg, #166534 0%, #14532d 100%)",
  rare:      "linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)",
  epic:      "linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%)",
  legendary: "linear-gradient(135deg, #d97706 0%, #92400e 100%)",
};

export const CATCH_LEVEL_LABELS: Record<number, string> = {
  1: "Connected",
  2: "Collaborated",
  3: "Delivered",
};

export const CATCH_LEVEL_ICONS: Record<number, string> = {
  1: "☕",
  2: "🤝",
  3: "🚀",
};

export const CATCH_LEVEL_DESC: Record<number, string> = {
  1: "grabbed time to talk, or got introduced",
  2: "worked through a project or problem together",
  3: "built, shipped, or presented something together",
};
