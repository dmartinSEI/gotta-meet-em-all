import type { BadgeInfo } from "./types";

export const ALL_BADGES: BadgeInfo[] = [
  // ── Meetings ─────────────────────────────────────────────────────────────
  { id: "first_contact",    category: "Meetings",    name: "First Contact",    icon: "🤝", description: "Log your first meeting." },
  { id: "networker_10",     category: "Meetings",    name: "Networker",        icon: "📇", description: "Meet 10 colleagues." },
  { id: "social_butterfly", category: "Meetings",    name: "Social Butterfly", icon: "🦋", description: "Meet 10 different people within 30 days." },
  { id: "speed_networker",  category: "Meetings",    name: "Speed Networker",  icon: "⏱️", description: "Meet 5 people within 7 days." },
  { id: "networker_50",     category: "Meetings",    name: "Connector",        icon: "🌐", description: "Meet 50 colleagues." },
  { id: "century_club",     category: "Meetings",    name: "Century Club",     icon: "💯", description: "Meet 100 colleagues." },

  // ── Depth ────────────────────────────────────────────────────────────────
  { id: "collaborator",     category: "Depth",       name: "Collaborator",     icon: "🤜", description: "Log a Collaborated relationship." },
  { id: "true_partner",     category: "Depth",       name: "True Partner",     icon: "💎", description: "Log a Delivered relationship." },
  { id: "delivered_5",      category: "Depth",       name: "Project Partner",  icon: "🚀", description: "Log 5 Delivered relationships." },
  { id: "delivered_25",     category: "Depth",       name: "Impact Player",    icon: "⚡", description: "Log 25 Delivered relationships." },

  // ── Exploration ──────────────────────────────────────────────────────────
  { id: "getting_around",   category: "Exploration", name: "Getting Around",   icon: "🗺️", description: "Meet someone from 3 different offices." },
  { id: "office_champion",  category: "Exploration", name: "Office Champion",  icon: "🏆", description: "Meet everyone in a single office." },
  { id: "world_traveler",   category: "Exploration", name: "World Traveler",   icon: "✈️", description: "Meet someone from every office." },

  // ── Bounties ─────────────────────────────────────────────────────────────
  { id: "bounty_hunter",    category: "Bounties",    name: "Bounty Hunter",    icon: "🎯", description: "Complete your first monthly bounty." },
  { id: "dedicated_hunter", category: "Bounties",    name: "Dedicated Hunter", icon: "🔥", description: "Complete 3 monthly bounties." },
  { id: "bounty_streak",    category: "Bounties",    name: "Bounty Streak",    icon: "🔑", description: "Complete 6 monthly bounties." },

  // ── Recognition ──────────────────────────────────────────────────────────
  { id: "recognized_5",     category: "Recognition", name: "Rising Star",      icon: "⭐", description: "Appear in 5 colleagues' collections." },
  { id: "recognized_25",    category: "Recognition", name: "Fan Favorite",     icon: "🌟", description: "Appear in 25 colleagues' collections." },

  // ── Rank ─────────────────────────────────────────────────────────────────
  { id: "rank_connected",     category: "Rank",      name: "Well Connected",   icon: "🔗", description: "Reach Connected rank." },
  { id: "rank_established",   category: "Rank",      name: "Established Pro",  icon: "🏅", description: "Reach Established rank." },
  { id: "rank_influential",   category: "Rank",      name: "Influential",      icon: "👑", description: "Reach Influential rank." },
  { id: "rank_distinguished", category: "Rank",      name: "Distinguished",    icon: "🎖️", description: "Reach Distinguished rank." },
];

export const BADGE_MAP = new Map(ALL_BADGES.map((b) => [b.id, b]));
