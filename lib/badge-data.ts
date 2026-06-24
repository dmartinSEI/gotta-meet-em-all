import type { BadgeInfo } from "./types";

export const ALL_BADGES: BadgeInfo[] = [
  // ── Meetings ─────────────────────────────────────────────────────────────
  { id: "surge",              category: "Meetings",    name: "Surge",            icon: "💥", description: "Meet 10 people within 7 days." },
  { id: "networker_50",       category: "Meetings",    name: "Connector",        icon: "🌐", description: "Meet 50 colleagues." },
  { id: "century_club",       category: "Meetings",    name: "Century Club",     icon: "💯", description: "Meet 100 colleagues." },
  { id: "inner_circle",       category: "Meetings",    name: "Inner Circle",     icon: "⭕", description: "Meet 150 colleagues." },
  { id: "everybody_knows",    category: "Meetings",    name: "Everybody Knows",  icon: "🌍", description: "Meet 250 colleagues." },
  { id: "met_em_all",         category: "Meetings",    name: "Met Em' All",      icon: "🎴", description: "Meet every single consultant at SEI." },

  // ── Depth ────────────────────────────────────────────────────────────────
  { id: "delivered_25",       category: "Depth",       name: "Impact Player",    icon: "⚡", description: "Log 25 Delivered relationships." },
  { id: "iron_bond",          category: "Depth",       name: "Iron Bond",        icon: "⛓️", description: "Log 50 Delivered relationships." },
  { id: "living_legend",      category: "Depth",       name: "Living Legend",    icon: "🏛️", description: "Log 100 Delivered relationships." },

  // ── Exploration ──────────────────────────────────────────────────────────
  { id: "home_turf",          category: "Exploration", name: "Home Turf",        icon: "🏠", description: "Meet everyone in your own office." },
  { id: "world_traveler",     category: "Exploration", name: "World Traveler",   icon: "✈️", description: "Meet someone from every office." },

  // ── Bounties ─────────────────────────────────────────────────────────────
  { id: "bounty_streak",      category: "Bounties",    name: "Bounty Streak",    icon: "🔥", description: "Complete 6 monthly bounties." },

  // ── Recognition ──────────────────────────────────────────────────────────
  { id: "recognized_25",      category: "Recognition", name: "Rising Star",      icon: "⭐", description: "Appear in 25 colleagues' collections." },
  { id: "recognized_50",      category: "Recognition", name: "Fan Favorite",     icon: "🌟", description: "Appear in 50 colleagues' collections." },
  { id: "recognized_100",     category: "Recognition", name: "Household Name",   icon: "👑", description: "Appear in 100 colleagues' collections." },

  // ── Reciprocity ───────────────────────────────────────────────────────────
  { id: "mutual_25",          category: "Reciprocity", name: "Mutual Respect",   icon: "🤝", description: "Have 25 mutual catches — you caught them and they caught you." },
  { id: "mutual_50",          category: "Reciprocity", name: "True Network",     icon: "🕸️", description: "Have 50 mutual catches." },

  // ── Consistency ───────────────────────────────────────────────────────────
  { id: "iron_will",          category: "Consistency", name: "Iron Will",        icon: "💪", description: "Log at least one new meeting every month for 12 consecutive months." },

  // ── Prestige ──────────────────────────────────────────────────────────────
  { id: "dynasty",            category: "Prestige",    name: "Dynasty",          icon: "🏰", description: "Hold a Top 10 All Time ranking." },
  { id: "untouchable",        category: "Prestige",    name: "Untouchable",      icon: "💫", description: "Hold the #1 All Time ranking." },

  // ── Rank ─────────────────────────────────────────────────────────────────
  { id: "rank_influential",   category: "Rank",        name: "Influential",      icon: "💡", description: "Reach Influential rank." },
  { id: "rank_distinguished", category: "Rank",        name: "Distinguished",    icon: "🌠", description: "Reach Distinguished rank." },
];

export const BADGE_MAP = new Map(ALL_BADGES.map((b) => [b.id, b]));
