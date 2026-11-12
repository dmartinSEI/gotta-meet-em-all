-- Single source of truth for a player's all-time points.
-- Points = meets (10 / 25 / 50 by level) + completed bounty bonuses + 5 per onboarding step.
-- Keep the per-level values in sync with XP_PER_LEVEL in lib/xp.ts.
-- Monthly points are NOT here; they come from catch_events (see lib/ranks.ts, app/leaderboard).

CREATE OR REPLACE VIEW user_points AS
SELECT
  u.id    AS user_id,
  u.email AS email,
  COALESCE(ca.pts, 0)::int AS meet_points,
  COALESCE(b.pts, 0)::int  AS bounty_points,
  COALESCE(os.pts, 0)::int AS onboarding_points,
  (COALESCE(ca.pts, 0) + COALESCE(b.pts, 0) + COALESCE(os.pts, 0))::int AS total_points
FROM users u
LEFT JOIN (
  SELECT user_id,
         SUM(CASE level WHEN 1 THEN 10 WHEN 2 THEN 25 WHEN 3 THEN 50 ELSE 0 END) AS pts
  FROM catches
  GROUP BY user_id
) ca ON ca.user_id = u.id
LEFT JOIN (
  SELECT user_id, SUM(bonus_xp) AS pts
  FROM bounties
  WHERE completed_at IS NOT NULL
  GROUP BY user_id
) b ON b.user_id = u.id
LEFT JOIN (
  SELECT user_id, COUNT(*) * 5 AS pts
  FROM onboarding_steps
  GROUP BY user_id
) os ON os.user_id = u.id;
