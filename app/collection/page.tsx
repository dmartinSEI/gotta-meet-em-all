import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "../../auth";
import { sql } from "@/lib/db";
import type { ConsultantRow } from "@/lib/types";
import { getRarity, RARITY_LABELS, XP_PER_LEVEL, type Rarity } from "@/lib/xp";
import CollectionGallery from "./CollectionBinder";

const HEADER_RARITY: Record<Rarity, string> = {
  common:    "bg-white/10 text-white/80 border border-white/20",
  uncommon:  "bg-green-400/20 text-green-300 border border-green-400/40",
  rare:      "bg-blue-400/20 text-blue-300 border border-blue-400/40",
  epic:      "bg-purple-400/20 text-purple-200 border border-purple-400/40",
  legendary: "bg-yellow-400/20 text-yellow-300 border border-yellow-400/40",
};

export default async function CollectionPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  const [{ rows }, { rows: rosterRows }, { rows: officeTotalRows }] = await Promise.all([
    sql<ConsultantRow>`
      SELECT
        c.id, c.email, c.first_name, c.last_name, c.title, c.office, c.bio, c.skills,
        c.photo_url, c.photo_url_l1, c.photo_url_l2, c.photo_url_l3,
        (c.email = ${session.user.email}) AS is_own_card,
        ca.level AS catch_level,
        COALESCE(
          (SELECT json_agg(ub.badge_id ORDER BY ub.earned_at)
           FROM user_badges ub
           JOIN users cu ON cu.id = ub.user_id
           WHERE cu.email = c.email),
          '[]'::json
        ) AS badge_ids,
        (
          COALESCE((
            SELECT SUM(CASE ca2.level WHEN 1 THEN 10 WHEN 2 THEN 25 WHEN 3 THEN 50 ELSE 0 END)
            FROM catches ca2 JOIN users cu ON cu.id = ca2.user_id WHERE cu.email = c.email
          ), 0)
          + COALESCE((
            SELECT SUM(b.bonus_xp) FROM bounties b JOIN users cu ON cu.id = b.user_id
            WHERE cu.email = c.email AND b.completed_at IS NOT NULL
          ), 0)
        )::int AS consultant_xp
      FROM consultants c
      JOIN catches ca ON ca.consultant_id = c.id
      JOIN users u ON u.id = ca.user_id
      WHERE u.email = ${session.user.email}
      ORDER BY c.office, c.last_name, c.first_name
    `,
    sql`SELECT COUNT(*)::int AS n FROM consultants`,
    sql<{ office: string; total: number }>`
      SELECT office, COUNT(*)::int AS total
      FROM consultants
      GROUP BY office
    `,
  ]);

  const totalRoster = (rosterRows[0] as { n: number } | undefined)?.n ?? 0;

  const totalsByOffice: Record<string, number> = {};
  officeTotalRows.forEach((r) => { totalsByOffice[r.office] = r.total; });

  const totalXp = rows.reduce((sum, c) => {
    if (!c.catch_level) return sum;
    return sum + XP_PER_LEVEL[c.catch_level as 1 | 2 | 3];
  }, 0);
  const viewerRarity = getRarity(totalXp, totalRoster);

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
            <img src="/brand/sei-logoblack-002.svg" alt="SEI" style={{ height: 28 }} />
            <div className="hidden md:block w-px h-5 bg-white/20" />
            <Link
              href="/"
              className="hidden md:block text-white font-black text-lg leading-none tracking-tight whitespace-nowrap hover:text-white/80 transition-colors"
            >
              Gotta Meet Em All
            </Link>
          </div>

          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-white/50 text-sm tabular-nums">{totalXp} XP</span>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${HEADER_RARITY[viewerRarity]}`}>
                {RARITY_LABELS[viewerRarity]}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="w-px h-4 bg-white/20" />
              <nav className="flex items-center gap-4 flex-wrap">
                <Link href="/" className="text-white/65 hover:text-white text-sm font-medium transition-colors whitespace-nowrap">
                  Offices
                </Link>
                <Link href="/leaderboard" className="text-white/65 hover:text-white text-sm font-medium transition-colors whitespace-nowrap">
                  Leaderboard
                </Link>
                <Link href="/collection" className="text-white text-sm font-semibold whitespace-nowrap">
                  My Collection
                </Link>
                <Link href="/profile" className="text-white/65 hover:text-white text-sm font-medium transition-colors whitespace-nowrap">
                  My Profile
                </Link>
                <form action={async () => { "use server"; await signOut(); }}>
                  <button className="text-white/35 hover:text-white/65 text-sm transition-colors">
                    Sign out
                  </button>
                </form>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8">
        {rows.length === 0 ? (
          <div className="text-center py-24">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(45,27,78,0.07)" }}
            >
              <span className="text-3xl">📖</span>
            </div>
            <p className="text-[#2D1B4E] text-lg font-bold mb-1">Your collection is empty</p>
            <p className="text-sm mb-6" style={{ color: "rgba(45,27,78,0.45)" }}>
              Start meeting colleagues to build your collection.
            </p>
            <Link
              href="/"
              className="px-5 py-2.5 bg-[#C8102E] text-white rounded-xl text-sm font-bold hover:bg-[#a50d25] transition-colors"
            >
              Browse offices →
            </Link>
          </div>
        ) : (
          <CollectionGallery
            consultants={rows}
            totalRoster={totalRoster}
            totalsByOffice={totalsByOffice}
          />
        )}
      </main>
    </div>
  );
}
