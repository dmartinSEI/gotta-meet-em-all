import { sql } from "./db";
import type { BadgeInfo } from "./types";
import { ALL_BADGES, BADGE_MAP } from "./badge-data";
import { getRarity } from "./xp";

export type Badge = BadgeInfo;
export { ALL_BADGES } from "./badge-data";

interface UserStats {
  totalCatches: number;
  collaboratedCount: number;
  partneredCount: number;
  recentCatches: number;
  catches7Days: number;
  bountiesCompleted: number;
  officesWithCatch: number;
  officesCompleted: number;
  totalOffices: number;
  recognizedByCount: number;
  totalXp: number;
  rosterSize: number;
}

const RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary"] as const;

function newlyEarned(stats: UserStats, alreadyEarned: Set<string>): Badge[] {
  const rarityIdx = RARITY_ORDER.indexOf(getRarity(stats.totalXp, stats.rosterSize));

  const checks: [string, () => boolean][] = [
    // Meetings
    ["first_contact",       () => stats.totalCatches >= 1],
    ["networker_10",        () => stats.totalCatches >= 10],
    ["social_butterfly",    () => stats.recentCatches >= 10],
    ["speed_networker",     () => stats.catches7Days >= 5],
    ["networker_50",        () => stats.totalCatches >= 50],
    ["century_club",        () => stats.totalCatches >= 100],
    // Depth
    ["collaborator",        () => stats.collaboratedCount >= 1],
    ["true_partner",        () => stats.partneredCount >= 1],
    ["delivered_5",         () => stats.partneredCount >= 5],
    ["delivered_25",        () => stats.partneredCount >= 25],
    // Exploration
    ["getting_around",      () => stats.officesWithCatch >= 3],
    ["office_champion",     () => stats.officesCompleted >= 1],
    ["world_traveler",      () => stats.totalOffices > 0 && stats.officesWithCatch >= stats.totalOffices],
    // Bounties
    ["bounty_hunter",       () => stats.bountiesCompleted >= 1],
    ["dedicated_hunter",    () => stats.bountiesCompleted >= 3],
    ["bounty_streak",       () => stats.bountiesCompleted >= 6],
    // Recognition
    ["recognized_5",        () => stats.recognizedByCount >= 5],
    ["recognized_25",       () => stats.recognizedByCount >= 25],
    // Rank
    ["rank_connected",      () => rarityIdx >= 1],
    ["rank_established",    () => rarityIdx >= 2],
    ["rank_influential",    () => rarityIdx >= 3],
    ["rank_distinguished",  () => rarityIdx >= 4],
  ];

  return checks
    .filter(([id, check]) => !alreadyEarned.has(id) && check())
    .map(([id]) => BADGE_MAP.get(id))
    .filter((b): b is NonNullable<typeof b> => b !== undefined);
}

export async function checkAndAwardBadges(email: string): Promise<Badge[]> {
  interface CatchStats {
    total_catches: number; collaborated_count: number; partnered_count: number;
    recent_catches: number; catches_7_days: number;
  }
  interface OfficeStats { total_offices: number; offices_with_catch: number; offices_completed: number; }
  interface BountyStats { bounties_completed: number; }
  interface RecognizedStats { recognized_by_count: number; }
  interface XpStats { total_xp: number; roster_size: number; }

  const [catchResult, officeResult, bountyResult, recognizedResult, xpResult, earnedResult] =
    await Promise.all([
      sql<CatchStats>`
        SELECT
          COUNT(*)::int                                                            AS total_catches,
          COUNT(*) FILTER (WHERE level >= 2)::int                                 AS collaborated_count,
          COUNT(*) FILTER (WHERE level = 3)::int                                  AS partnered_count,
          COUNT(*) FILTER (WHERE caught_at >= NOW() - INTERVAL '30 days')::int    AS recent_catches,
          COUNT(*) FILTER (WHERE caught_at >= NOW() - INTERVAL '7 days')::int     AS catches_7_days
        FROM catches ca
        JOIN users u ON u.id = ca.user_id
        WHERE u.email = ${email}
      `,
      sql<OfficeStats>`
        SELECT
          COUNT(*) FILTER (WHERE total_count > 0)::int                                      AS total_offices,
          COUNT(*) FILTER (WHERE met_count > 0)::int                                        AS offices_with_catch,
          COUNT(*) FILTER (WHERE total_count > 0 AND met_count >= total_count)::int         AS offices_completed
        FROM (
          SELECT o.name,
            COUNT(c.id)::int             AS total_count,
            COUNT(ca.consultant_id)::int AS met_count
          FROM offices o
          LEFT JOIN consultants c ON c.office = o.name
          LEFT JOIN catches ca    ON ca.consultant_id = c.id
            AND ca.user_id = (SELECT id FROM users WHERE email = ${email})
          GROUP BY o.name
        ) t
      `,
      sql<BountyStats>`
        SELECT COALESCE(COUNT(*), 0)::int AS bounties_completed
        FROM bounties b
        JOIN users u ON u.id = b.user_id
        WHERE u.email = ${email} AND b.completed_at IS NOT NULL
      `,
      sql<RecognizedStats>`
        SELECT COUNT(DISTINCT ca.user_id)::int AS recognized_by_count
        FROM catches ca
        WHERE ca.consultant_id = (SELECT id FROM consultants WHERE email = ${email})
      `,
      sql<XpStats>`
        SELECT
          (COALESCE((
            SELECT SUM(CASE ca.level WHEN 1 THEN 10 WHEN 2 THEN 25 WHEN 3 THEN 50 ELSE 0 END)
            FROM catches ca WHERE ca.user_id = u.id
          ), 0)
          + COALESCE((
            SELECT SUM(b.bonus_xp) FROM bounties b
            WHERE b.user_id = u.id AND b.completed_at IS NOT NULL
          ), 0))::int AS total_xp,
          (SELECT COUNT(*)::int FROM consultants) AS roster_size
        FROM users u WHERE u.email = ${email}
      `,
      sql<{ badge_id: string }>`
        SELECT ub.badge_id FROM user_badges ub
        JOIN users u ON u.id = ub.user_id
        WHERE u.email = ${email}
      `,
    ]);

  const c = catchResult.rows[0];
  const o = officeResult.rows[0];
  const x = xpResult.rows[0];
  if (!c || !o || !x) return [];

  const stats: UserStats = {
    totalCatches:      c.total_catches,
    collaboratedCount: c.collaborated_count,
    partneredCount:    c.partnered_count,
    recentCatches:     c.recent_catches,
    catches7Days:      c.catches_7_days,
    bountiesCompleted: bountyResult.rows[0]?.bounties_completed ?? 0,
    recognizedByCount: recognizedResult.rows[0]?.recognized_by_count ?? 0,
    officesWithCatch:  o.offices_with_catch,
    officesCompleted:  o.offices_completed,
    totalOffices:      o.total_offices,
    totalXp:           x.total_xp,
    rosterSize:        x.roster_size,
  };

  const badges = newlyEarned(stats, new Set(earnedResult.rows.map((r) => r.badge_id)));
  if (badges.length === 0) return [];

  for (const badge of badges) {
    await sql`
      INSERT INTO user_badges (user_id, badge_id)
      SELECT u.id, ${badge.id} FROM users u WHERE u.email = ${email}
      ON CONFLICT (user_id, badge_id) DO NOTHING
    `;
  }

  return badges;
}
