import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "../../auth";
import { pool, sql } from "@/lib/db";
import { getRarity, RARITY_LABELS, HEADER_RARITY } from "@/lib/xp";
import type { ConsultantRow } from "@/lib/types";
import SearchResultsGrid from "./SearchResultsGrid";

interface SearchRow extends ConsultantRow {
  survey_data: Record<string, string> | null;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const [{ rows: xpRows }, { rows: rosterRows }] = await Promise.all([
    sql`
      SELECT
        COALESCE((
          SELECT SUM(CASE ca.level WHEN 1 THEN 10 WHEN 2 THEN 25 WHEN 3 THEN 50 ELSE 0 END)
          FROM catches ca WHERE ca.user_id = u.id
        ), 0)::int
        + COALESCE((
          SELECT SUM(b.bonus_xp) FROM bounties b
          WHERE b.user_id = u.id AND b.completed_at IS NOT NULL
        ), 0)::int AS total_xp
      FROM users u WHERE u.email = ${session.user.email}
    `,
    sql`SELECT COUNT(*)::int AS n FROM consultants`,
  ]);

  const totalXp: number = (xpRows[0] as { total_xp: number } | undefined)?.total_xp ?? 0;
  const rosterSize: number = (rosterRows[0] as { n: number } | undefined)?.n ?? 0;
  const viewerRarity = getRarity(totalXp, rosterSize);

  let results: SearchRow[] = [];
  let searchError = false;
  if (query.length >= 2) {
    const pattern = `%${query}%`;
    try {
      const { rows } = await pool.query<SearchRow>(
        `SELECT
           c.id, c.email, c.first_name, c.last_name, c.title, c.office,
           c.bio, c.skills, c.survey_data,
           c.photo_url, c.photo_url_l1, c.photo_url_l2, c.photo_url_l3,
           c.card_bg_url, COALESCE(c.is_new_hire, false) AS is_new_hire,
           COALESCE((
             SELECT SUM(CASE ca2.level WHEN 1 THEN 10 WHEN 2 THEN 25 WHEN 3 THEN 50 ELSE 0 END)
             FROM catches ca2 JOIN users cu ON cu.id = ca2.user_id WHERE cu.email = c.email
           ), 0)::int AS consultant_xp,
           (SELECT ca.level FROM catches ca
            JOIN users u ON u.id = ca.user_id
            WHERE ca.consultant_id = c.id AND u.email = $2) AS catch_level,
           (c.email = $2) AS is_own_card,
           COALESCE(
             (SELECT json_agg(ub.badge_id) FROM user_badges ub JOIN users cu ON cu.id = ub.user_id WHERE cu.email = c.email),
             '[]'::json
           ) AS badge_ids,
           NULL::int AS alltime_rank,
           NULL::int AS monthly_rank,
           NULL::text AS preferred_comm,
           NULL::text AS current_client,
           NULL::text AS past_clients
         FROM consultants c
         WHERE (
           c.bio ILIKE $1
           OR c.survey_data::text ILIKE $1
           OR c.skills ILIKE $1
         )
         ORDER BY c.first_name, c.last_name
         LIMIT 30`,
        [pattern, session.user.email]
      );
      const adminEmails = new Set(
        (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim().toLowerCase())
      );
      results = rows.map(r => ({ ...r, is_creator: adminEmails.has(r.email.toLowerCase()) }));
    } catch (err) {
      console.error("Search query failed:", err);
      searchError = true;
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4fb" }}>

      {/* Header */}
      <header className="relative bg-[#2D1B4E] overflow-hidden">
        <svg className="absolute right-0 top-0 h-full w-80 opacity-[0.12]"
             viewBox="0 0 320 80" preserveAspectRatio="xMaxYMid meet" aria-hidden>
          {[35, 65, 95, 125, 155, 185, 215, 250].map(r => (
            <circle key={r} cx="320" cy="40" r={r} fill="none" stroke="#C8102E" strokeWidth="1" />
          ))}
        </svg>
        <div className="relative max-w-5xl mx-auto px-4 md:px-8 py-5 flex items-center justify-between gap-4 md:gap-6">
          <Link href="/" className="text-white font-black text-lg leading-none tracking-tight whitespace-nowrap hover:text-white/80 transition-colors">
            SEI Gotta Meet Em&apos; All
          </Link>
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-white/50 text-sm tabular-nums">{totalXp} pts</span>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${HEADER_RARITY[viewerRarity]}`}>
                {RARITY_LABELS[viewerRarity]}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="w-px h-4 bg-white/20" />
              <nav className="flex items-center gap-4 flex-wrap">
                <Link href="/" className="text-white/65 hover:text-white text-sm font-medium transition-colors whitespace-nowrap">Offices</Link>
                <Link href="/leaderboard" className="text-white/65 hover:text-white text-sm font-medium transition-colors whitespace-nowrap">Leaderboard</Link>
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

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8">

        {/* Search bar */}
        <form action="/search" method="GET" className="mb-8">
          <div className="flex gap-3">
            <input
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Search by interest, skill, hobby, or topic…"
              autoFocus
              className="flex-1 px-4 py-3 text-sm rounded-xl focus:outline-none"
              style={{
                border: "1.5px solid rgba(45,27,78,0.15)",
                background: "#fff",
                color: "#2D1B4E",
              }}
            />
            <button
              type="submit"
              className="px-6 py-3 text-sm font-bold rounded-xl text-white transition-opacity hover:opacity-90"
              style={{ background: "#C8102E" }}
            >
              Search
            </button>
          </div>
        </form>

        {searchError ? (
          <p className="text-center text-sm py-16" style={{ color: "rgba(45,27,78,0.40)" }}>
            Search is temporarily unavailable — please try again in a moment.
          </p>
        ) : query.length < 2 ? (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: "rgba(45,27,78,0.40)" }}>
              Find colleagues with shared interests
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {["running", "coffee", "hiking", "agile", "cooking", "travel", "dogs", "music"].map(term => (
                <a
                  key={term}
                  href={`/search?q=${term}`}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors hover:bg-[#2D1B4E] hover:text-white"
                  style={{ background: "rgba(45,27,78,0.07)", color: "rgba(45,27,78,0.60)" }}
                >
                  {term}
                </a>
              ))}
            </div>
          </div>
        ) : results.length === 0 ? (
          <p className="text-center text-sm py-16" style={{ color: "rgba(45,27,78,0.40)" }}>
            No one matched &ldquo;{query}&rdquo; — try a different term
          </p>
        ) : (
          <>
            <p className="text-[9px] font-black tracking-[0.2em] uppercase mb-4"
               style={{ color: "rgba(45,27,78,0.40)" }}>
              {results.length} {results.length === 1 ? "match" : "matches"} for &ldquo;{query}&rdquo;
            </p>
            <SearchResultsGrid consultants={results} rosterSize={rosterSize} />
          </>
        )}
      </main>
    </div>
  );
}
