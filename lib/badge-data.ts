import type { BadgeInfo } from "./types";

export const ALL_BADGES: BadgeInfo[] = [
  { id: "first_contact",    name: "First Contact",    icon: "🤝", description: "Log your first meeting." },
  { id: "getting_around",   name: "Getting Around",   icon: "🗺️", description: "Meet someone from 3 different offices." },
  { id: "world_traveler",   name: "World Traveler",   icon: "✈️", description: "Meet someone from every office." },
  { id: "office_champion",  name: "Office Champion",  icon: "🏆", description: "Meet everyone in a single office." },
  { id: "collaborator",     name: "Collaborator",     icon: "🤜", description: "Upgrade a relationship to Collaborated." },
  { id: "true_partner",     name: "True Partner",     icon: "💎", description: "Upgrade a relationship to Partnered." },
  { id: "social_butterfly", name: "Social Butterfly", icon: "🦋", description: "Meet 10 different people within 30 days." },
  { id: "bounty_hunter",    name: "Bounty Hunter",    icon: "🎯", description: "Complete your first monthly bounty." },
  { id: "dedicated_hunter", name: "Dedicated Hunter", icon: "🔥", description: "Complete 3 monthly bounties." },
  { id: "century_club",     name: "Century Club",     icon: "💯", description: "Meet 100 people total." },
];

export const BADGE_MAP = new Map(ALL_BADGES.map((b) => [b.id, b]));
