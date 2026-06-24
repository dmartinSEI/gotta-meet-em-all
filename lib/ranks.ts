import { sql } from "./db";

export interface UserRanks {
  alltime_rank: number | null;
  monthly_rank: number | null;
}

export async function getAllUserRanks(): Promise<Map<string, UserRanks>> {
  const { rows } = await sql<{
    email: string;
    alltime_rank: number;
    monthly_rank: number;
    alltime_xp: number;
    monthly_xp: number;
  }>`
    WITH user_alltime AS (
      SELECT
        u.id,
        u.email,
        COALESCE(SUM(CASE ca.level WHEN 1 THEN 10 WHEN 2 THEN 25 WHEN 3 THEN 50 ELSE 0 END), 0)::int AS catch_xp
      FROM users u
      LEFT JOIN catches ca ON ca.user_id = u.id
      GROUP BY u.id, u.email
    ),
    bounties_alltime AS (
      SELECT user_id, COALESCE(SUM(bonus_xp), 0)::int AS bounty_xp
      FROM bounties WHERE completed_at IS NOT NULL
      GROUP BY user_id
    ),
    monthly_ce AS (
      SELECT user_id, COALESCE(SUM(xp_gained), 0)::int AS xp
      FROM catch_events
      WHERE created_at >= date_trunc('month', now())
      GROUP BY user_id
    ),
    monthly_bounty AS (
      SELECT user_id, COALESCE(SUM(bonus_xp), 0)::int AS bounty_xp
      FROM bounties
      WHERE completed_at IS NOT NULL AND completed_at >= date_trunc('month', now())
      GROUP BY user_id
    ),
    ranked AS (
      SELECT
        a.email,
        (a.catch_xp + COALESCE(ba.bounty_xp, 0)) AS alltime_xp,
        (COALESCE(mx.xp, 0) + COALESCE(mb.bounty_xp, 0)) AS monthly_xp,
        RANK() OVER (ORDER BY (a.catch_xp + COALESCE(ba.bounty_xp, 0)) DESC)::int AS alltime_rank,
        RANK() OVER (ORDER BY (COALESCE(mx.xp, 0) + COALESCE(mb.bounty_xp, 0)) DESC)::int AS monthly_rank
      FROM user_alltime a
      LEFT JOIN bounties_alltime ba ON ba.user_id = a.id
      LEFT JOIN monthly_ce mx ON mx.user_id = a.id
      LEFT JOIN monthly_bounty mb ON mb.user_id = a.id
    )
    SELECT email, alltime_rank, monthly_rank, alltime_xp, monthly_xp
    FROM ranked
  `;

  const map = new Map<string, UserRanks>();
  for (const row of rows) {
    map.set(row.email, {
      alltime_rank: row.alltime_rank <= 50 && row.alltime_xp > 0 ? row.alltime_rank : null,
      monthly_rank: row.monthly_rank <= 25 && row.monthly_xp > 0 ? row.monthly_rank : null,
    });
  }
  return map;
}
