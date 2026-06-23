import { sql } from "./db";
import type { BadgeInfo } from "./types";
import { ALL_BADGES, BADGE_MAP } from "./badge-data";

export type Badge = BadgeInfo;
export { ALL_BADGES } from "./badge-data";

interface UserStats {
  totalCatches: number;
  collaboratedCount: number;
  partneredCount: number;
  recentCatches: number;
  bountiesCompleted: number;
  officesWithCatch: number;
  officesCompleted: number;
  totalOffices: number;
}

function newlyEarned(stats: UserStats, alreadyEarned: Set<string>): Badge[] {
  const checks: [string, () => boolean][] = [
    ["first_contact",    () => stats.totalCatches >= 1],
    ["getting_around",   () => stats.officesWithCatch >= 3],
    ["world_traveler",   () => stats.totalOffices > 0 && stats.officesWithCatch >= stats.totalOffices],
    ["office_champion",  () => stats.officesCompleted >= 1],
    ["collaborator",     () => stats.collaboratedCount >= 1],
    ["true_partner",     () => stats.partneredCount >= 1],
    ["social_butterfly", () => stats.recentCatches >= 10],
    ["bounty_hunter",    () => stats.bountiesCompleted >= 1],
    ["dedicated_hunter", () => stats.bountiesCompleted >= 3],
    ["century_club",     () => stats.totalCatches >= 100],
  ];
  return checks
    .filter(([id, check]) => !alreadyEarned.has(id) && check())
    .map(([id]) => BADGE_MAP.get(id))
    .filter((b): b is NonNullable<typeof b> => b !== undefined);
}

export async function checkAndAwardBadges(email: string): Promise<Badge[]> {
  interface CatchStats { total_catches: number; collaborated_count: number; partnered_count: number; recent_catches: number; }
  interface OfficeStats { total_offices: number; offices_with_catch: number; offices_completed: number; }
  interface BountyStats { bounties_completed: number; }

  const [catchResult, officeResult, bountyResult, earnedResult] = await Promise.all([
    sql<CatchStats>`
      SELECT
        COUNT(*)::int                                                  AS total_catches,
        COUNT(*) FILTER (WHERE level >= 2)::int                       AS collaborated_count,
        COUNT(*) FILTER (WHERE level = 3)::int                        AS partnered_count,
        COUNT(*) FILTER (WHERE caught_at >= NOW() - INTERVAL '30 days')::int AS recent_catches
      FROM catches ca
      JOIN users u ON u.id = ca.user_id
      WHERE u.email = ${email}
    `,
    sql<OfficeStats>`
      SELECT
        COUNT(*) FILTER (WHERE total_count > 0)::int                                AS total_offices,
        COUNT(*) FILTER (WHERE met_count > 0)::int                                  AS offices_with_catch,
        COUNT(*) FILTER (WHERE total_count > 0 AND met_count >= total_count)::int   AS offices_completed
      FROM (
        SELECT
          o.name,
          COUNT(c.id)::int             AS total_count,
          COUNT(ca.consultant_id)::int AS met_count
        FROM offices o
        LEFT JOIN consultants c  ON c.office = o.name
        LEFT JOIN catches ca     ON ca.consultant_id = c.id
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
    sql<{ badge_id: string }>`
      SELECT ub.badge_id
      FROM user_badges ub
      JOIN users u ON u.id = ub.user_id
      WHERE u.email = ${email}
    `,
  ]);

  const c = catchResult.rows[0];
  const o = officeResult.rows[0];
  if (!c || !o) return [];

  const stats: UserStats = {
    totalCatches:      c.total_catches,
    collaboratedCount: c.collaborated_count,
    partneredCount:    c.partnered_count,
    recentCatches:     c.recent_catches,
    bountiesCompleted: bountyResult.rows[0]?.bounties_completed ?? 0,
    officesWithCatch:  o.offices_with_catch,
    officesCompleted:  o.offices_completed,
    totalOffices:      o.total_offices,
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
