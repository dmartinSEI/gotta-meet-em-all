-- Track every XP-earning event so monthly leaderboard includes upgrade XP.
-- Each row = one discrete XP event: initial catch or a level upgrade.

CREATE TABLE catch_events (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
  consultant_id  INTEGER NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
  xp_gained      INTEGER NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_catch_events_user_created ON catch_events (user_id, created_at);

-- Backfill: treat all existing catches as earning their full current-level XP
-- at the time they were originally caught. Level 2/3 catches will appear as a
-- single combined event rather than the original catch + upgrade, which is the
-- best approximation available without historical upgrade timestamps.
INSERT INTO catch_events (user_id, consultant_id, xp_gained, created_at)
SELECT
  user_id,
  consultant_id,
  CASE level WHEN 1 THEN 10 WHEN 2 THEN 25 WHEN 3 THEN 50 ELSE 0 END,
  caught_at
FROM catches;
