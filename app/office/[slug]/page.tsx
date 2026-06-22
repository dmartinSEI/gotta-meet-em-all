import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "../../../auth";
import { sql } from "@/lib/db";
import ConsultantGrid from "../../ConsultantGrid";
import type { ConsultantRow } from "@/lib/types";
import { getRarity, RARITY_LABELS, type Rarity } from "@/lib/xp";

interface OfficeRecord {
  name: string;
  slug: string;
  description: string;
}

interface GlobalStats {
  total_xp: number;
  roster_size: number;
}

const HEADER_RARITY: Record<Rarity, string> = {
  common:    "bg-white/10 text-white/80 border border-white/20",
  uncommon:  "bg-green-400/20 text-green-300 border border-green-400/40",
  rare:      "bg-blue-400/20 text-blue-300 border border-blue-400/40",
  epic:      "bg-purple-400/20 text-purple-200 border border-purple-400/40",
  legendary: "bg-yellow-400/20 text-yellow-300 border border-yellow-400/40",
};

export default async function OfficePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  const [{ rows: officeRows }, { rows: statsRows }] = await Promise.all([
    sql<OfficeRecord>`
      SELECT name, slug, description
      FROM offices
      WHERE slug = ${slug}
      LIMIT 1
    `,
    sql<GlobalStats>`
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
      FROM users u
      WHERE u.email = ${session.user.email}
    `,
  ]);

  if (officeRows.length === 0) redirect("/");
  const office = officeRows[0];
  const totalXp = statsRows[0]?.total_xp ?? 0;
  const globalRosterSize = statsRows[0]?.roster_size ?? 0;

  const { rows } = await sql<ConsultantRow>`
    SELECT
      c.id, c.email, c.first_name, c.last_name, c.title, c.office, c.bio, c.skills,
      c.photo_url, c.photo_url_l1, c.photo_url_l2, c.photo_url_l3,
      (c.email = ${session.user.email}) AS is_own_card,
      (
        SELECT ca.level FROM catches ca
        JOIN users u ON u.id = ca.user_id
        WHERE ca.consultant_id = c.id
          AND u.email = ${session.user.email}
      ) AS catch_level,
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
    WHERE c.office = ${office.name}
    ORDER BY c.last_name, c.first_name
  `;

  const total = rows.length;
  const met = rows.filter((c) => c.catch_level !== null).length;
  const pct = total > 0 ? Math.round((met / total) * 100) : 0;
  const done = pct === 100 && total > 0;

  const globalRarity = getRarity(totalXp, globalRosterSize);

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

        <div className="relative max-w-5xl mx-auto px-8 py-5 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 shrink-0">
            <img src="/brand/sei-logo-white.svg" alt="SEI" style={{ height: 28 }} />
            <div className="w-px h-5 bg-white/20" />
            <Link
              href="/"
              className="text-white font-black text-lg leading-none tracking-tight whitespace-nowrap hover:text-white/80 transition-colors"
            >
              Gotta Meet Em All
            </Link>
          </div>

          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-white/50 text-sm tabular-nums">{totalXp} XP</span>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${HEADER_RARITY[globalRarity]}`}>
                {RARITY_LABELS[globalRarity]}
              </span>
            </div>
            <div className="w-px h-4 bg-white/20 shrink-0" />
            <nav className="flex items-center gap-4 flex-wrap">
              <Link href="/" className="text-white text-sm font-semibold whitespace-nowrap">
                Offices
              </Link>
              <Link href="/leaderboard" className="text-white/65 hover:text-white text-sm font-medium transition-colors whitespace-nowrap">
                Leaderboard
              </Link>
              <Link href="/collection" className="text-white/65 hover:text-white text-sm font-medium transition-colors whitespace-nowrap">
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
      </header>

      {/* ── Office sub-header ────────────────────────────────────── */}
      <div className="bg-white border-b" style={{ borderColor: "rgba(45,27,78,0.08)" }}>
        <div className="max-w-5xl mx-auto px-8 py-4 flex items-center justify-between gap-6">
          <div className="min-w-0">
            <p className="text-[9px] font-black tracking-[0.2em] uppercase text-[#2D1B4E]/40 mb-0.5">Office</p>
            <h1 className="text-xl font-black text-[#2D1B4E] leading-tight">{office.name}</h1>
            {office.description && (
              <p className="text-xs mt-0.5" style={{ color: "rgba(45,27,78,0.40)" }}>{office.description}</p>
            )}
          </div>

          {total > 0 && (
            <div className="shrink-0 flex items-center gap-4">
              <div className="text-right">
                <p className="text-[9px] font-black tracking-[0.2em] uppercase text-[#2D1B4E]/40 mb-1">Progress</p>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(45,27,78,0.08)" }}>
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: done ? "#22c55e" : "#C8102E" }}
                    />
                  </div>
                  <span className="text-xs tabular-nums font-semibold" style={{ color: done ? "#16a34a" : "#2D1B4E" }}>
                    {met}/{total}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-8 py-8">
        {total === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#2D1B4E] font-bold mb-1">No consultants in this office yet.</p>
            <p className="text-sm mb-5" style={{ color: "rgba(45,27,78,0.40)" }}>
              <a href="/admin" className="text-[#C8102E] hover:underline">Upload the roster</a> to get started.
            </p>
          </div>
        ) : (
          <ConsultantGrid
            consultants={rows}
            rosterSize={globalRosterSize}
            officeName={office.name}
            officeImageUrl={null}
          />
        )}
      </main>
    </div>
  );
}
