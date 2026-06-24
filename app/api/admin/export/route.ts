import * as XLSX from "xlsx";
import { auth } from "../../../../auth";
import { sql } from "@/lib/db";
import { BADGE_MAP } from "@/lib/badge-data";

async function requireAdmin(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",").map((e) => e.trim()).filter(Boolean);
  return adminEmails.includes(session.user.email);
}

export async function GET() {
  if (!(await requireAdmin())) {
    return new Response("Forbidden", { status: 403 });
  }

  // ── Fetch all data in parallel ────────────────────────────────────────────
  const [overviewRes, rankingsRes, officeRes, monthlyRes, badgeRes, crossOfficeRes] =
    await Promise.all([

      // Key counts for the summary sheet
      sql`
        SELECT
          (SELECT COUNT(*)::int FROM consultants)                     AS total_consultants,
          (SELECT COUNT(*)::int FROM users)                           AS total_players,
          (SELECT COUNT(*)::int FROM catches)                         AS total_meets,
          (SELECT COUNT(*)::int FROM catches WHERE level = 3)         AS delivered,
          (SELECT COUNT(*)::int FROM catches WHERE level = 2)         AS hung_out,
          (SELECT COUNT(*)::int FROM catches WHERE level = 1)         AS connected,
          (SELECT COUNT(*)::int FROM user_badges)                     AS total_badges_awarded
      `,

      // Per-player stats, ranked by XP
      sql`
        SELECT
          RANK() OVER (
            ORDER BY COALESCE(SUM(CASE ca.level WHEN 1 THEN 10 WHEN 2 THEN 25 WHEN 3 THEN 50 ELSE 0 END), 0) DESC
          )::int                                                                      AS rank,
          COALESCE(c.first_name || ' ' || c.last_name, u.email)                      AS name,
          u.email,
          COALESCE(c.office, '')                                                      AS office,
          COALESCE(c.title,  '')                                                      AS title,
          COUNT(ca.id)::int                                                           AS total_meets,
          SUM(CASE WHEN ca.level = 3 THEN 1 ELSE 0 END)::int                         AS delivered,
          SUM(CASE WHEN ca.level = 2 THEN 1 ELSE 0 END)::int                         AS hung_out,
          SUM(CASE WHEN ca.level = 1 THEN 1 ELSE 0 END)::int                         AS connected,
          COALESCE(SUM(CASE ca.level WHEN 1 THEN 10 WHEN 2 THEN 25 WHEN 3 THEN 50 ELSE 0 END), 0)::int AS total_xp,
          COUNT(DISTINCT ub.badge_id)::int                                            AS badges_earned,
          TO_CHAR(MAX(ca.caught_at), 'YYYY-MM-DD')                                   AS last_active
        FROM users u
        LEFT JOIN consultants c  ON c.email = u.email
        LEFT JOIN catches ca     ON ca.user_id = u.id
        LEFT JOIN user_badges ub ON ub.user_id = u.id
        GROUP BY u.id, u.email, c.first_name, c.last_name, c.office, c.title
        ORDER BY total_xp DESC
      `,

      // Per-office breakdown
      sql`
        SELECT
          o.name                                                                       AS office,
          COUNT(DISTINCT c.id)::int                                                   AS roster_size,
          COUNT(DISTINCT u.id)::int                                                   AS active_players,
          COUNT(DISTINCT ca.id)::int                                                  AS total_meets,
          SUM(CASE WHEN ca.level = 3 THEN 1 ELSE 0 END)::int                         AS delivered,
          COUNT(DISTINCT CASE WHEN c2.office IS DISTINCT FROM o.name THEN ca.id END)::int AS cross_office_meets
        FROM offices o
        LEFT JOIN consultants c  ON c.office  = o.name
        LEFT JOIN users u        ON u.email   = c.email
        LEFT JOIN catches ca     ON ca.user_id = u.id
        LEFT JOIN consultants c2 ON c2.id     = ca.consultant_id
        GROUP BY o.name
        ORDER BY roster_size DESC
      `,

      // Monthly trends — last 12 months
      sql`
        SELECT
          TO_CHAR(DATE_TRUNC('month', caught_at), 'YYYY-MM') AS month,
          COUNT(*)::int                                       AS meets_logged,
          COUNT(DISTINCT user_id)::int                       AS active_players
        FROM catches
        WHERE caught_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', caught_at)
        ORDER BY DATE_TRUNC('month', caught_at)
      `,

      // Badge earn counts
      sql<{ badge_id: string; earner_count: number; first_earned: string; last_earned: string }>`
        SELECT
          badge_id,
          COUNT(*)::int                                        AS earner_count,
          TO_CHAR(MIN(earned_at), 'YYYY-MM-DD')               AS first_earned,
          TO_CHAR(MAX(earned_at), 'YYYY-MM-DD')               AS last_earned
        FROM user_badges
        GROUP BY badge_id
        ORDER BY earner_count DESC
      `,

      // Total cross-office connections (catcher and caught in different offices)
      sql`
        SELECT COUNT(*)::int AS count
        FROM catches ca
        JOIN users u        ON u.id  = ca.user_id
        JOIN consultants c1 ON c1.email = u.email
        JOIN consultants c2 ON c2.id    = ca.consultant_id
        WHERE c1.office IS NOT NULL
          AND c2.office IS NOT NULL
          AND c1.office IS DISTINCT FROM c2.office
      `,
    ]);

  // ── Computed summary values ───────────────────────────────────────────────
  const ov            = overviewRes.rows[0] as Record<string, number>;
  const totalPlayers  = ov.total_players;
  const totalMeets    = ov.total_meets;
  const crossOffice   = (crossOfficeRes.rows[0] as Record<string, number>)?.count ?? 0;
  const avgMeets      = totalPlayers > 0 ? (totalMeets / totalPlayers).toFixed(1) : "0";
  const participationRate =
    ov.total_consultants > 0
      ? ((totalPlayers / ov.total_consultants) * 100).toFixed(1) + "%"
      : "0%";
  const reportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  // ── Build workbook ────────────────────────────────────────────────────────
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Summary ─────────────────────────────────────────────────────
  const summaryAoa: (string | number)[][] = [
    ["SEI Gotta Meet Em All — Leadership Report"],
    ["Generated", reportDate],
    [],
    ["ADOPTION"],
    ["Consultants on Roster",        ov.total_consultants],
    ["Players Signed In",            totalPlayers],
    ["Participation Rate",           participationRate],
    [],
    ["ACTIVITY"],
    ["Total Meets Logged",           totalMeets],
    ["  Delivered Relationships",    ov.delivered],
    ["  Hung Out",                   ov.hung_out],
    ["  Connected",                  ov.connected],
    ["Avg Meets per Active Player",  Number(avgMeets)],
    ["Cross-Office Connections",     crossOffice],
    [],
    ["ACHIEVEMENTS"],
    ["Total Badges Awarded",         ov.total_badges_awarded],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa);
  wsSummary["!cols"] = [{ wch: 34 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  // ── Sheet 2: Player Rankings ──────────────────────────────────────────────
  const rankHeaders = [
    "Rank", "Name", "Email", "Office", "Title",
    "Total Meets", "Delivered", "Hung Out", "Connected",
    "Total XP", "Badges Earned", "Last Active",
  ];
  const rankRows = (rankingsRes.rows as Record<string, unknown>[]).map((r) => [
    r.rank, r.name, r.email, r.office, r.title,
    r.total_meets, r.delivered, r.hung_out, r.connected,
    r.total_xp, r.badges_earned, r.last_active ?? "Never",
  ]);
  const wsRankings = XLSX.utils.aoa_to_sheet([rankHeaders, ...rankRows]);
  wsRankings["!cols"] = [
    { wch: 6 }, { wch: 26 }, { wch: 30 }, { wch: 16 }, { wch: 26 },
    { wch: 13 }, { wch: 11 }, { wch: 10 }, { wch: 11 },
    { wch: 10 }, { wch: 14 }, { wch: 13 },
  ];
  XLSX.utils.book_append_sheet(wb, wsRankings, "Player Rankings");

  // ── Sheet 3: By Office ────────────────────────────────────────────────────
  const officeHeaders = [
    "Office", "Roster Size", "Active Players", "Participation %",
    "Total Meets", "Avg Meets / Player", "Delivered", "Cross-Office Meets",
  ];
  const officeRows = (officeRes.rows as Record<string, number | string>[]).map((r) => [
    r.office,
    r.roster_size,
    r.active_players,
    (r.roster_size as number) > 0
      ? (((r.active_players as number) / (r.roster_size as number)) * 100).toFixed(1) + "%"
      : "0%",
    r.total_meets,
    (r.active_players as number) > 0
      ? ((r.total_meets as number) / (r.active_players as number)).toFixed(1)
      : "0",
    r.delivered,
    r.cross_office_meets,
  ]);
  const wsOffice = XLSX.utils.aoa_to_sheet([officeHeaders, ...officeRows]);
  wsOffice["!cols"] = [
    { wch: 20 }, { wch: 13 }, { wch: 15 }, { wch: 16 },
    { wch: 13 }, { wch: 18 }, { wch: 11 }, { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsOffice, "By Office");

  // ── Sheet 4: Monthly Trends ───────────────────────────────────────────────
  const monthlyHeaders = ["Month", "Meets Logged", "Active Players"];
  const monthlyRows = (monthlyRes.rows as Record<string, unknown>[]).map((r) => [
    r.month, r.meets_logged, r.active_players,
  ]);
  const wsMonthly = XLSX.utils.aoa_to_sheet([monthlyHeaders, ...monthlyRows]);
  wsMonthly["!cols"] = [{ wch: 12 }, { wch: 14 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsMonthly, "Monthly Trends");

  // ── Sheet 5: Badge Stats ──────────────────────────────────────────────────
  const badgeHeaders = [
    "Badge", "Category", "Description",
    "Earners", "% of Active Players", "First Earned", "Last Earned",
  ];
  const earnedMap = new Map(
    (badgeRes.rows as { badge_id: string; earner_count: number; first_earned: string; last_earned: string }[])
      .map((r) => [r.badge_id, r])
  );
  const badgeRows = [...BADGE_MAP.values()].map((info) => {
    const stats = earnedMap.get(info.id);
    const earners = stats?.earner_count ?? 0;
    const pct = totalPlayers > 0 ? ((earners / totalPlayers) * 100).toFixed(1) + "%" : "0%";
    return [
      info.name,
      info.category,
      info.description,
      earners,
      pct,
      stats?.first_earned ?? "—",
      stats?.last_earned  ?? "—",
    ];
  });
  const wsBadges = XLSX.utils.aoa_to_sheet([badgeHeaders, ...badgeRows]);
  wsBadges["!cols"] = [
    { wch: 22 }, { wch: 14 }, { wch: 48 },
    { wch: 10 }, { wch: 18 }, { wch: 14 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsBadges, "Badge Stats");

  // ── Serialize and return ──────────────────────────────────────────────────
  const raw = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
  const blob = new Blob([raw], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const filename = `sei-network-report-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new Response(blob, {
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
