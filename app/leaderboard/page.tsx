import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth, signOut } from "../../auth";
import { pool, sql } from "@/lib/db";
import { getRarity, RARITY_LABELS, type Rarity } from "@/lib/xp";
import LeaderboardFilters from "./LeaderboardFilters";
import { Suspense } from "react";

interface LeaderboardEntry {
  first_name: string;
  last_name: string;
  email: string;
  office: string;
  photo_url: string;
  total_xp: number;
  total_met: number;
  roster_size: number;
}

const HEADER_RARITY: Record<Rarity, string> = {
  common:    "bg-white/10 text-white/80 border border-white/20",
  uncommon:  "bg-green-400/20 text-green-300 border border-green-400/40",
  rare:      "bg-blue-400/20 text-blue-300 border border-blue-400/40",
  epic:      "bg-purple-400/20 text-purple-200 border border-purple-400/40",
  legendary: "bg-yellow-400/20 text-yellow-300 border border-yellow-400/40",
};

const RARITY_RING: Record<Rarity, string> = {
  common:    "rgba(255,255,255,0.50)",
  uncommon:  "#4ade80",
  rare:      "#60a5fa",
  epic:      "#c084fc",
  legendary: "#fbbf24",
};

const RARITY_BAR: Record<Rarity, string> = {
  common:    "rgba(45,27,78,0.22)",
  uncommon:  "#4ade80",
  rare:      "#60a5fa",
  epic:      "#c084fc",
  legendary: "#fbbf24",
};

const RARITY_ROW_BADGE: Record<Rarity, { bg: string; color: string }> = {
  common:    { bg: "rgba(45,27,78,0.06)",   color: "rgba(45,27,78,0.45)" },
  uncommon:  { bg: "rgba(74,222,128,0.12)",  color: "#15803d" },
  rare:      { bg: "rgba(96,165,250,0.12)",  color: "#1d4ed8" },
  epic:      { bg: "rgba(192,132,252,0.12)", color: "#7e22ce" },
  legendary: { bg: "rgba(251,191,36,0.15)",  color: "#b45309" },
};

const AVATAR_COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f97316",
  "#ec4899", "#14b8a6", "#6366f1", "#f43f5e",
];

const MEDAL = ["🥇", "🥈", "🥉"];

// 2nd, 1st, 3rd — render order (left→right on screen)
const PODIUM_COL_ORDER = [1, 0, 2];

// Staircase: how far each column is pushed down (px) so 1st sits highest
const PODIUM_SINK = [24, 0, 44] as const;

const PODIUM_MEDAL = [
  { border: "#94a3b8", accent: "#475569", ring: "#94a3b8" }, // 2nd — silver
  { border: "#f59e0b", accent: "#b45309", ring: "#f59e0b" }, // 1st — gold
  { border: "#c87941", accent: "#7c3d1a", ring: "#c87941" }, // 3rd — bronze
] as const;

function Avatar({ name, photoUrl, size }: { name: string; photoUrl: string; size: number }) {
  const initials = name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  const bg = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: bg }}>
      {photoUrl ? (
        <Image src={photoUrl} alt={name} width={size} height={size} className="object-cover object-top" />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: size * 0.36 }}>
          {initials}
        </div>
      )}
    </div>
  );
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; office?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  const { period, office } = await searchParams;
  const isMonthly    = period === "month";
  const officeFilter = office?.trim() || null;

  // Build query dynamically based on filters
  const queryParams: string[] = [];
  const officeWhere = officeFilter
    ? (queryParams.push(officeFilter), `WHERE c.office = $1`)
    : "";

  // All-time: sum pts from catches (current level). Monthly: sum from catch_events
  // this month (captures upgrade deltas recorded at upgrade time) + bounty pts.
  const xpExpr = isMonthly
    ? `COALESCE((
         SELECT SUM(ce.xp_gained) FROM catch_events ce
         WHERE ce.user_id = u.id
           AND ce.created_at >= date_trunc('month', now())
       ), 0)::int
       + COALESCE((
           SELECT SUM(b.bonus_xp) FROM bounties b
           WHERE b.user_id = u.id AND b.completed_at IS NOT NULL
             AND b.completed_at >= date_trunc('month', now())
         ), 0)::int`
    : `COALESCE(SUM(
         CASE ca.level WHEN 1 THEN 10 WHEN 2 THEN 25 WHEN 3 THEN 50 ELSE 0 END
       ), 0)::int
       + COALESCE((
           SELECT SUM(b.bonus_xp) FROM bounties b
           WHERE b.user_id = u.id AND b.completed_at IS NOT NULL
         ), 0)::int`;

  const metExpr = isMonthly
    ? `COALESCE((
         SELECT COUNT(*)::int FROM catches ca2
         WHERE ca2.user_id = u.id
           AND ca2.caught_at >= date_trunc('month', now())
           AND ca2.consultant_id != c.id
       ), 0)::int`
    : `COUNT(CASE WHEN ca.consultant_id != c.id THEN 1 END)::int`;

  const catchesJoin = isMonthly ? "" : "LEFT JOIN catches ca ON ca.user_id = u.id";

  const [{ rows }, { rows: officeRows }, { rows: statsRows }] = await Promise.all([
    pool.query<LeaderboardEntry>(`
      SELECT
        c.first_name,
        c.last_name,
        c.email,
        c.office,
        c.photo_url,
        ${xpExpr} AS total_xp,
        ${metExpr} AS total_met,
        (SELECT COUNT(*)::int FROM consultants) AS roster_size
      FROM consultants c
      JOIN users u ON u.email = c.email
      ${catchesJoin}
      ${officeWhere}
      GROUP BY c.id, c.first_name, c.last_name, c.email, c.office, c.photo_url, u.id
      ORDER BY total_xp DESC, total_met DESC, c.last_name, c.first_name
    `, queryParams),

    sql<{ name: string }>`SELECT name FROM offices ORDER BY sort_order, name`,

    sql`
      SELECT
        COALESCE((
          SELECT SUM(CASE ca.level WHEN 1 THEN 10 WHEN 2 THEN 25 WHEN 3 THEN 50 ELSE 0 END)
          FROM catches ca WHERE ca.user_id = u.id
        ), 0)::int
        + COALESCE((
          SELECT SUM(b.bonus_xp) FROM bounties b
          WHERE b.user_id = u.id AND b.completed_at IS NOT NULL
        ), 0)::int AS total_xp,
        (SELECT COUNT(*)::int FROM consultants) AS roster_size
      FROM users u WHERE u.email = ${session.user.email}
    `,
  ]);

  // For monthly: hide users with zero activity
  const displayRows = isMonthly ? rows.filter((r) => r.total_xp > 0 || r.total_met > 0) : rows;

  const viewerXp     = (statsRows[0] as { total_xp: number } | undefined)?.total_xp ?? 0;
  const rosterSize   = (statsRows[0] as { roster_size: number } | undefined)?.roster_size ?? 0;
  const viewerRarity = getRarity(viewerXp, rosterSize);
  const viewerRow    = displayRows.find((r) => r.email === session.user!.email);
  const viewerRank   = viewerRow ? displayRows.indexOf(viewerRow) + 1 : null;
  const top3         = displayRows.slice(0, 3);
  const topXp        = displayRows[0]?.total_xp ?? 1;
  const offices      = officeRows.map((r) => r.name);

  return (
    <div className="min-h-screen">

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="relative bg-[#2D1B4E] overflow-hidden">
        <svg
          className="absolute right-0 top-0 h-full w-80 opacity-[0.12]"
          viewBox="0 0 320 80"
          preserveAspectRatio="xMaxYMid meet"
          aria-hidden
        >
          {[35, 65, 95, 125, 155, 185, 215, 250].map((r) => (
            <circle key={r} cx="320" cy="40" r={r} fill="none" stroke="#C8102E" strokeWidth="1" />
          ))}
        </svg>

        <div className="relative max-w-5xl mx-auto px-4 md:px-8 py-5 flex items-center justify-between gap-4 md:gap-6">
          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            <Link href="/" className="text-white font-black text-lg leading-none tracking-tight whitespace-nowrap hover:text-white/80 transition-colors">
              SEI Gotta Meet Em&apos; All
            </Link>
          </div>

          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-white/50 text-sm tabular-nums">{viewerXp} pts</span>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${HEADER_RARITY[viewerRarity]}`}>
                {RARITY_LABELS[viewerRarity]}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="w-px h-4 bg-white/20" />
              <nav className="flex items-center gap-4 flex-wrap">
                <Link href="/" className="text-white/65 hover:text-white text-sm font-medium transition-colors whitespace-nowrap">Offices</Link>
                <Link href="/leaderboard" className="text-white text-sm font-semibold whitespace-nowrap">Leaderboard</Link>
                <Link href="/collection" className="text-white/65 hover:text-white text-sm font-medium transition-colors whitespace-nowrap">My Collection</Link>
                <Link href="/profile" className="text-white/65 hover:text-white text-sm font-medium transition-colors whitespace-nowrap">My Profile</Link>
                <form action={async () => { "use server"; await signOut(); }}>
                  <button className="text-white/35 hover:text-white/65 text-sm transition-colors">Sign out</button>
                </form>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-4 md:px-8 py-8">

        {/* Page title + context */}
        <div className="mb-6">
          <p className="text-[9px] font-black tracking-[0.2em] uppercase text-[#2D1B4E]/40 mb-1">Rankings</p>
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-black text-[#2D1B4E] leading-tight">
              {isMonthly ? "This Month" : "All Time"}
              {officeFilter && <span className="text-[#C8102E]"> · {officeFilter}</span>}
            </h1>
            {isMonthly && (
              <span className="text-xs" style={{ color: "rgba(45,27,78,0.38)" }}>
                {new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}
              </span>
            )}
          </div>
        </div>

        {/* Filters */}
        <Suspense>
          <LeaderboardFilters offices={offices} />
        </Suspense>

        {displayRows.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#2D1B4E] font-bold mb-1">
              {isMonthly ? "No activity yet this month." : "No one has started yet."}
            </p>
            <p className="text-sm" style={{ color: "rgba(45,27,78,0.38)" }}>
              {isMonthly ? "Catches made this month will appear here." : "Be the first to meet a colleague."}
            </p>
          </div>
        ) : (
          <>
            {/* ── Podium ──────────────────────────────────────────── */}
            {top3.length > 0 && (
              <div className="flex items-end justify-center gap-2 sm:gap-3 mb-8 px-1">
                {PODIUM_COL_ORDER.map((rankIdx) => {
                  const entry = top3[rankIdx];
                  if (!entry) return null;
                  const rank     = rankIdx + 1;
                  const isSelf   = entry.email === session.user!.email;
                  const fullName = `${entry.first_name} ${entry.last_name}`;
                  const rarity   = getRarity(entry.total_xp, rosterSize);
                  const pct      = rosterSize > 0 ? Math.round((entry.total_met / rosterSize) * 100) : 0;
                  const mc       = PODIUM_MEDAL[rankIdx];

                  return (
                    <div
                      key={entry.email}
                      className="flex flex-col items-center min-w-0"
                      style={{
                        flex: 1,
                        marginBottom: PODIUM_SINK[rankIdx],
                        transform: isSelf ? "scale(1.03)" : undefined,
                        transformOrigin: "bottom center",
                      }}
                    >
                      {/* Crown above 1st */}
                      {rank === 1 && (
                        <div style={{ fontSize: 20, lineHeight: 1, marginBottom: 4 }}>👑</div>
                      )}

                      {/* Medal emoji */}
                      <div style={{ fontSize: rank === 1 ? 22 : 18, lineHeight: 1, marginBottom: 8 }}>
                        {MEDAL[rankIdx]}
                      </div>

                      {/* Avatar */}
                      <div style={{
                        borderRadius: "50%",
                        padding: 3,
                        background: isSelf ? "#C8102E" : mc.ring,
                        boxShadow: rank === 1 ? `0 0 22px 6px ${mc.ring}55` : undefined,
                        marginBottom: 10,
                        flexShrink: 0,
                      }}>
                        <Avatar name={fullName} photoUrl={entry.photo_url} size={rank === 1 ? 76 : 56} />
                      </div>

                      {/* Info card */}
                      <div style={{
                        width: "100%",
                        background: "#fff",
                        border: `2px solid ${mc.border}`,
                        borderRadius: 14,
                        padding: rank === 1 ? "14px 10px 12px" : "12px 8px 10px",
                        textAlign: "center",
                        boxShadow: rank === 1
                          ? `0 4px 20px ${mc.ring}33`
                          : "0 2px 8px rgba(0,0,0,0.06)",
                      }}>
                        {/* Name */}
                        <p style={{
                          fontSize: rank === 1 ? 13 : 11,
                          fontWeight: 800,
                          color: "#2D1B4E",
                          lineHeight: 1.2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}>
                          {entry.first_name}
                          {isSelf && <span style={{ color: "#C8102E" }}> ★</span>}
                        </p>
                        <p style={{
                          fontSize: rank === 1 ? 12 : 10,
                          fontWeight: 700,
                          color: "#2D1B4E",
                          lineHeight: 1.2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          marginTop: 1,
                        }}>
                          {entry.last_name}
                        </p>

                        {/* Office */}
                        <p style={{
                          fontSize: 9,
                          color: "rgba(45,27,78,0.38)",
                          marginTop: 3,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}>
                          {entry.office}
                        </p>

                        {/* Points */}
                        <p style={{
                          fontSize: rank === 1 ? 17 : 14,
                          fontWeight: 900,
                          color: mc.accent,
                          marginTop: 7,
                          lineHeight: 1,
                          letterSpacing: "-0.02em",
                        }}>
                          {entry.total_xp}
                          <span style={{ fontSize: rank === 1 ? 10 : 9, fontWeight: 700, marginLeft: 2 }}>pts</span>
                        </p>

                        {/* Rarity + meet count */}
                        <span style={{
                          display: "inline-block",
                          marginTop: 5,
                          fontSize: 9,
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: 99,
                          background: RARITY_ROW_BADGE[rarity].bg,
                          color: RARITY_ROW_BADGE[rarity].color,
                        }}>
                          {RARITY_LABELS[rarity]}
                        </span>
                        <p style={{ fontSize: 9, color: "rgba(45,27,78,0.30)", marginTop: 4 }}>
                          {isMonthly ? `${entry.total_met} this month` : `${entry.total_met} met · ${pct}%`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Your rank callout (if outside top 3) ────────────── */}
            {viewerRank && viewerRank > 3 && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5"
                   style={{ background: "rgba(200,16,46,0.06)", border: "1.5px solid rgba(200,16,46,0.18)" }}>
                <span className="text-sm font-black text-[#C8102E] tabular-nums">#{viewerRank}</span>
                <p className="text-sm font-semibold text-[#2D1B4E]">Your current rank</p>
                <span className="ml-auto text-xs tabular-nums" style={{ color: "rgba(45,27,78,0.45)" }}>
                  {viewerRow?.total_xp ?? 0} pts
                </span>
              </div>
            )}

            {/* ── Ranked list ─────────────────────────────────────── */}
            <div className="flex flex-col gap-1.5">
              {displayRows.slice(0, isMonthly ? 25 : 50).map((entry, i) => {
                const rank     = i + 1;
                const isSelf   = entry.email === session.user!.email;
                const fullName = `${entry.first_name} ${entry.last_name}`;
                const rarity   = getRarity(entry.total_xp, rosterSize);
                const barPct   = topXp > 0 ? Math.round((entry.total_xp / topXp) * 100) : 0;
                const catchPct = rosterSize > 0 ? Math.round((entry.total_met / rosterSize) * 100) : 0;

                return (
                  <div
                    key={entry.email}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={isSelf
                      ? { background: "#2D1B4E", border: "1.5px solid #2D1B4E" }
                      : { background: "#fff", border: "1.5px solid rgba(45,27,78,0.08)" }
                    }
                  >
                    {/* Rank */}
                    <span className="w-7 text-sm font-black tabular-nums shrink-0 text-center"
                          style={{ color: isSelf ? "rgba(255,255,255,0.55)" : rank <= 3 ? "#2D1B4E" : "rgba(45,27,78,0.28)" }}>
                      {rank <= 3 ? MEDAL[rank - 1] : `#${rank}`}
                    </span>

                    {/* Avatar with rarity ring */}
                    <div style={{ borderRadius: "50%", padding: 2, flexShrink: 0, background: isSelf ? "rgba(255,255,255,0.15)" : RARITY_RING[rarity] }}>
                      <Avatar name={fullName} photoUrl={entry.photo_url} size={34} />
                    </div>

                    {/* Name + office + bar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <p className="font-bold text-sm leading-tight truncate"
                           style={{ color: isSelf ? "#fff" : "#2D1B4E" }}>
                          {fullName}
                        </p>
                        {isSelf && (
                          <span className="text-[10px] font-semibold shrink-0" style={{ color: "rgba(255,255,255,0.45)" }}>
                            you
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] truncate mt-0.5"
                         style={{ color: isSelf ? "rgba(255,255,255,0.40)" : "rgba(45,27,78,0.35)" }}>
                        {entry.office}
                      </p>
                      <div className="mt-1.5 w-full rounded-full overflow-hidden"
                           style={{ height: 3, background: isSelf ? "rgba(255,255,255,0.10)" : "rgba(45,27,78,0.06)" }}>
                        <div className="h-full rounded-full transition-all duration-500"
                             style={{ width: `${barPct}%`, background: isSelf ? "rgba(255,255,255,0.45)" : RARITY_BAR[rarity] }} />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={isSelf
                              ? { background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.70)" }
                              : { background: RARITY_ROW_BADGE[rarity].bg, color: RARITY_ROW_BADGE[rarity].color }
                            }>
                        {RARITY_LABELS[rarity]}
                      </span>
                      <p className="text-sm font-black tabular-nums"
                         style={{ color: isSelf ? "#fff" : "#2D1B4E" }}>
                        {entry.total_xp} pts
                      </p>
                      <p className="text-[11px] tabular-nums"
                         style={{ color: isSelf ? "rgba(255,255,255,0.40)" : "rgba(45,27,78,0.35)" }}>
                        {isMonthly
                          ? `${entry.total_met} new this month`
                          : `${entry.total_met} met · ${catchPct}%`
                        }
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {displayRows.length > (isMonthly ? 25 : 50) && (
              <p className="text-center text-xs mt-4" style={{ color: "rgba(45,27,78,0.35)" }}>
                Showing top {isMonthly ? 25 : 50} · {displayRows.length} total participants
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
