export const XP_PER_LEVEL = { 1: 10, 2: 25, 3: 50 } as const;

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export const RARITY_LABELS: Record<Rarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

// Border/glow styles for each rarity tier
export const RARITY_STYLES: Record<Rarity, string> = {
  common: "border-gray-200",
  uncommon: "border-green-400 ring-1 ring-green-300",
  rare: "border-blue-400 ring-1 ring-blue-300",
  epic: "border-purple-500 ring-2 ring-purple-300",
  legendary: "border-yellow-400 ring-2 ring-yellow-300 shadow-yellow-100",
};

export const RARITY_BADGE_STYLES: Record<Rarity, string> = {
  common: "bg-gray-100 text-gray-500",
  uncommon: "bg-green-100 text-green-700",
  rare: "bg-blue-100 text-blue-700",
  epic: "bg-purple-100 text-purple-700",
  legendary: "bg-yellow-100 text-yellow-700",
};

export function computeXp(catches: { level: 1 | 2 | 3 }[]): number {
  return catches.reduce((sum, c) => sum + XP_PER_LEVEL[c.level], 0);
}

// Legendary floor = every consultant Collaborated with (level 2, 25 XP each)
export function getRarity(xp: number, rosterSize: number): Rarity {
  if (rosterSize === 0 || xp === 0) return "common";
  const legendaryFloor = rosterSize * XP_PER_LEVEL[2];
  if (xp >= legendaryFloor) return "legendary";
  if (xp >= Math.round(legendaryFloor * 0.417)) return "epic";     // ~1,000 XP at 96
  if (xp >= Math.round(legendaryFloor * 0.167)) return "rare";     // ~400 XP at 96
  if (xp >= Math.round(legendaryFloor * 0.042)) return "uncommon"; // ~100 XP at 96
  return "common";
}

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
