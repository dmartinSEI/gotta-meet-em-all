import { sql } from "./db";
import type { BadgeInfo } from "./types";
import { ALL_BADGES, BADGE_MAP } from "./badge-data";
import { getRarity } from "./xp";

export type Badge = BadgeInfo;
export { ALL_BADGES } from "./badge-data";

interface UserStats {
  totalCatches: number;
  partneredCount: number;
  catches7Days: number;
  bountiesCompleted: number;
  officesWithCatch: number;
  officesCompleted: number;
  totalOffices: number;
  recognizedByCount: number;
  totalXp: number;
  rosterSize: number;
  mutualCatches: number;
  homeOfficeMet: number;
  homeOfficeTotal: number;
  hasPhoto: boolean;
  hasCardBg: boolean;
  hasSurvey: boolean;
  monthlyStreak: number;
  alltimeRank: number | null;
}

const RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary"] as const;

function computeMonthlyStreak(activeMonths: string[]): number {
  const monthSet = new Set(activeMonths);
  let streak = 0;
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth() - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    if (monthSet.has(key)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function newlyEarned(stats: UserStats, alreadyEarned: Set<string>): Badge[] {
  const rarityIdx = RARITY_ORDER.indexOf(getRarity(stats.totalXp, stats.rosterSize));
  const homeTurfDone = stats.homeOfficeTotal > 0 && stats.homeOfficeMet >= stats.homeOfficeTotal;
  const metEmAllDone = stats.rosterSize > 0 && stats.totalCatches >= stats.rosterSize;

  const checks: [string, () => boolean][] = [
    // Meetings
    ["networker_10",       () => stats.totalCatches >= 10],
    ["speed_networker",    () => stats.catches7Days >= 5],
    ["surge",              () => stats.catches7Days >= 10],
    ["networker_50",       () => stats.totalCatches >= 50],
    ["century_club",       () => stats.totalCatches >= 100],
    ["inner_circle",       () => stats.totalCatches >= 150],
    ["everybody_knows",    () => stats.totalCatches >= 250],
    ["met_em_all",         () => metEmAllDone],
    // Depth
    ["true_partner",       () => stats.partneredCount >= 1],
    ["delivered_5",        () => stats.partneredCount >= 5],
    ["delivered_25",       () => stats.partneredCount >= 25],
    ["iron_bond",          () => stats.partneredCount >= 50],
    ["living_legend",      () => stats.partneredCount >= 100],
    // Exploration
    ["home_turf",          () => homeTurfDone],
    ["office_champion",    () => stats.officesCompleted >= 1],
    ["world_traveler",     () => stats.totalOffices > 0 && stats.officesWithCatch >= stats.totalOffices],
    // Bounties
    ["dedicated_hunter",   () => stats.bountiesCompleted >= 3],
    ["bounty_streak",      () => stats.bountiesCompleted >= 6],
    // Recognition
    ["recognized_25",      () => stats.recognizedByCount >= 25],
    ["recognized_50",      () => stats.recognizedByCount >= 50],
    ["recognized_100",     () => stats.recognizedByCount >= 100],
    // Reciprocity
    ["mutual_25",          () => stats.mutualCatches >= 25],
    ["mutual_50",          () => stats.mutualCatches >= 50],
    // Consistency
    ["iron_will",          () => stats.monthlyStreak >= 12],
    // Prestige
    ["full_picture",       () => stats.hasPhoto && stats.hasCardBg && stats.hasSurvey],
    ["dynasty",            () => stats.alltimeRank !== null && stats.alltimeRank <= 10],
    ["untouchable",        () => stats.alltimeRank === 1],
    // Rank
    ["rank_connected",     () => rarityIdx >= 1],
    ["rank_established",   () => rarityIdx >= 2],
    ["rank_influential",   () => rarityIdx >= 3],
    ["rank_distinguished", () => rarityIdx >= 4],
  ];

  return checks
    .filter(([id, check]) => !alreadyEarned.has(id) && check())
    .map(([id]) => BADGE_MAP.get(id))
    .filter((b): b is NonNullable<typeof b> => b !== undefined);
}

export async function checkAndAwardBadges(email: string): Promise<Badge[]> {
  interface CatchStats {
    total_catches: number; partnered_count: number; catches_7_days: number;
  }
  interface OfficeStats { total_offices: number; offices_with_catch: number; offices_completed: number; }
  interface BountyStats { bounties_completed: number; }
  interface RecognizedStats { recognized_by_count: number; }
  interface XpStats { total_xp: number; roster_size: number; }
  interface MutualStats { mutual_catches: number; }
  interface HomeOfficeStats { home_office_met: number; home_office_total: number; }
  interface ProfileStats { has_photo: boolean; has_card_bg: boolean; has_survey: boolean; }
  interface ActiveMonthRow { active_month: string; }
  interface RankStats { alltime_rank: number; }

  const [
    catchResult, officeResult, bountyResult, recognizedResult, xpResult,
    mutualResult, homeOfficeResult, profileResult, activeMonthsResult, rankResult,
    earnedResult,
  ] = await Promise.all([
    sql<CatchStats>`
      SELECT
        COUNT(*)::int                                                         AS total_catches,
        COUNT(*) FILTER (WHERE level = 3)::int                               AS partnered_count,
        COUNT(*) FILTER (WHERE caught_at >= NOW() - INTERVAL '7 days')::int  AS catches_7_days
      FROM catches ca
      JOIN users u ON u.id = ca.user_id
      WHERE u.email = ${email}
    `,
    sql<OfficeStats>`
      SELECT
        COUNT(*) FILTER (WHERE total_count > 0)::int                                    AS total_offices,
        COUNT(*) FILTER (WHERE met_count > 0)::int                                      AS offices_with_catch,
        COUNT(*) FILTER (WHERE total_count > 0 AND met_count >= total_count)::int       AS offices_completed
      FROM (
        SELECT o.name,
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
    // Mutual catches: user caught them AND they caught user
    sql<MutualStats>`
      SELECT COUNT(*)::int AS mutual_catches
      FROM catches outgoing
      JOIN users u          ON u.id = outgoing.user_id
      JOIN consultants them ON them.id = outgoing.consultant_id
      JOIN users them_user  ON them_user.email = them.email
      JOIN catches incoming ON incoming.user_id = them_user.id
        AND incoming.consultant_id = (SELECT c.id FROM consultants c WHERE c.email = ${email})
      WHERE u.email = ${email}
    `,
    // Home office completeness (excluding self)
    sql<HomeOfficeStats>`
      WITH user_office AS (SELECT office FROM consultants WHERE email = ${email})
      SELECT
        COUNT(c.id) FILTER (WHERE c.email != ${email})::int                    AS home_office_total,
        COUNT(ca.consultant_id)::int                                           AS home_office_met
      FROM consultants c
      LEFT JOIN catches ca ON ca.consultant_id = c.id
        AND ca.user_id = (SELECT id FROM users WHERE email = ${email})
      WHERE c.office = (SELECT office FROM user_office)
        AND c.email != ${email}
    `,
    // Profile completeness
    sql<ProfileStats>`
      SELECT
        (photo_url   IS NOT NULL AND photo_url   != '')::boolean AS has_photo,
        (card_bg_url IS NOT NULL AND card_bg_url != '')::boolean AS has_card_bg,
        (survey_data IS NOT NULL AND survey_data::text NOT IN ('{}', 'null', ''))::boolean AS has_survey
      FROM consultants WHERE email = ${email}
    `,
    // Active months for streak (last 24 months)
    sql<ActiveMonthRow>`
      SELECT DISTINCT TO_CHAR(DATE_TRUNC('month', caught_at), 'YYYY-MM') AS active_month
      FROM catches ca
      JOIN users u ON u.id = ca.user_id
      WHERE u.email = ${email}
        AND caught_at >= NOW() - INTERVAL '24 months'
    `,
    // All-time rank
    sql<RankStats>`
      SELECT alltime_rank FROM (
        SELECT u.email,
          RANK() OVER (ORDER BY (
            COALESCE(SUM(CASE ca.level WHEN 1 THEN 10 WHEN 2 THEN 25 WHEN 3 THEN 50 ELSE 0 END), 0)
            + COALESCE((
                SELECT SUM(b.bonus_xp) FROM bounties b
                WHERE b.user_id = u.id AND b.completed_at IS NOT NULL
              ), 0)
          ) DESC)::int AS alltime_rank
        FROM users u
        JOIN consultants c ON c.email = u.email
        LEFT JOIN catches ca ON ca.user_id = u.id
        GROUP BY u.email, u.id
      ) ranked
      WHERE email = ${email}
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

  const prof    = profileResult.rows[0];
  const home    = homeOfficeResult.rows[0];
  const mutual  = mutualResult.rows[0];
  const rankRow = rankResult.rows[0];
  const activeMonths = activeMonthsResult.rows.map((r) => r.active_month);

  const stats: UserStats = {
    totalCatches:      c.total_catches,
    partneredCount:    c.partnered_count,
    catches7Days:      c.catches_7_days,
    bountiesCompleted: bountyResult.rows[0]?.bounties_completed ?? 0,
    recognizedByCount: recognizedResult.rows[0]?.recognized_by_count ?? 0,
    officesWithCatch:  o.offices_with_catch,
    officesCompleted:  o.offices_completed,
    totalOffices:      o.total_offices,
    totalXp:           x.total_xp,
    rosterSize:        x.roster_size,
    mutualCatches:     mutual?.mutual_catches ?? 0,
    homeOfficeMet:     home?.home_office_met ?? 0,
    homeOfficeTotal:   home?.home_office_total ?? 0,
    hasPhoto:          prof?.has_photo ?? false,
    hasCardBg:         prof?.has_card_bg ?? false,
    hasSurvey:         prof?.has_survey ?? false,
    monthlyStreak:     computeMonthlyStreak(activeMonths),
    alltimeRank:       rankRow?.alltime_rank ?? null,
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
