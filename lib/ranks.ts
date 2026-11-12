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
    -- Same population and formulas as the leaderboard page: players on the roster,
    -- all-time from the user_points view, monthly from this month's events.
    WITH players AS (
      SELECT up.user_id AS id, up.email, up.total_points
      FROM user_points up
      JOIN consultants c ON c.email = up.email
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
    monthly_onboarding AS (
      SELECT user_id, (COUNT(*) * 5)::int AS xp
      FROM onboarding_steps
      WHERE completed_at >= date_trunc('month', now())
      GROUP BY user_id
    ),
    totals AS (
      SELECT
        p.email,
        p.total_points AS alltime_xp,
        (COALESCE(mx.xp, 0) + COALESCE(mb.bounty_xp, 0) + COALESCE(mo.xp, 0)) AS monthly_xp
      FROM players p
      LEFT JOIN monthly_ce mx         ON mx.user_id = p.id
      LEFT JOIN monthly_bounty mb     ON mb.user_id = p.id
      LEFT JOIN monthly_onboarding mo ON mo.user_id = p.id
    ),
    ranked AS (
      SELECT
        email, alltime_xp, monthly_xp,
        RANK() OVER (ORDER BY alltime_xp DESC)::int AS alltime_rank,
        RANK() OVER (ORDER BY monthly_xp DESC)::int AS monthly_rank
      FROM totals
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
