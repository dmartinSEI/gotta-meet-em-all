import Link from "next/link";
import { auth, signOut } from "../auth";
import { sql } from "@/lib/db";
import type { OfficeRow } from "@/lib/types";
import { getRarity, RARITY_LABELS } from "@/lib/xp";
import { getOrAssignBounty } from "@/lib/bounty";
import BountyCard from "./BountyCard";
import type { Rarity } from "@/lib/xp";

const HEADER_RARITY: Record<Rarity, string> = {
  common:    "bg-white/10 text-white/80 border border-white/20",
  uncommon:  "bg-green-400/20 text-green-300 border border-green-400/40",
  rare:      "bg-blue-400/20 text-blue-300 border border-blue-400/40",
  epic:      "bg-purple-400/20 text-purple-200 border border-purple-400/40",
  legendary: "bg-yellow-400/20 text-yellow-300 border border-yellow-400/40",
};

export default async function HomePage() {
  const session = await auth();

  if (!session?.user?.email) {
    return (
      <div className="min-h-screen bg-[#2D1B4E] flex flex-col items-center justify-center relative overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-10" aria-hidden>
          {[80, 140, 200, 260, 320, 380, 440].map((r) => (
            <circle key={r} cx="50%" cy="50%" r={r} fill="none" stroke="#C8102E" strokeWidth="1" />
          ))}
        </svg>
        <div className="relative flex flex-col items-center text-center px-6">
          <img src="/brand/sei-logo-white.svg" alt="SEI" style={{ height: 48 }} />
          <h1 className="text-white font-black text-5xl tracking-tight mt-6 mb-3">Gotta Meet Em All</h1>
          <p className="text-white/40 text-sm mb-10">Gamified colleague networking for the firm.</p>
          <a
            href="/api/auth/signin"
            className="px-7 py-3 bg-[#C8102E] text-white rounded-xl font-bold text-sm hover:bg-[#a50d25] transition-colors"
          >
            Sign in with SEI Email →
          </a>
        </div>
      </div>
    );
  }

  const [{ rows: officeRows }, { rows: xpRows }, bounty] = await Promise.all([
    sql<OfficeRow>`
      SELECT
        o.name,
        o.slug,
        o.description,
        o.sort_order,
        COUNT(c.id)::int             AS total_count,
        COUNT(ca.consultant_id)::int AS met_count
      FROM offices o
      LEFT JOIN consultants c ON c.office = o.name
      LEFT JOIN catches ca
        ON  ca.consultant_id = c.id
        AND ca.user_id = (SELECT id FROM users WHERE email = ${session.user.email})
      GROUP BY o.name, o.slug, o.description, o.sort_order
      ORDER BY o.sort_order
    `,
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
      FROM users u
      WHERE u.email = ${session.user.email}
    `,
    getOrAssignBounty(session.user.email),
  ]);

  const totalXp: number = (xpRows[0] as { total_xp: number } | undefined)?.total_xp ?? 0;
  const globalRosterSize = officeRows.reduce((sum, o) => sum + o.total_count, 0);
  const rarity = getRarity(totalXp, globalRosterSize);

  return (
    <div className="min-h-screen">

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="relative bg-[#2D1B4E] overflow-hidden">
        {/* Concentric circle decoration */}
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
          {/* Brand */}
          <div className="flex items-center gap-4 shrink-0">
            <img src="/brand/sei-logo-white.svg" alt="SEI" style={{ height: 28 }} />
            <div className="w-px h-5 bg-white/20" />
            <h1 className="text-white font-black text-lg leading-none tracking-tight whitespace-nowrap">
              Gotta Meet Em All
            </h1>
          </div>

          {/* Nav + XP */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-white/50 text-sm tabular-nums">{totalXp} XP</span>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${HEADER_RARITY[rarity]}`}>
                {RARITY_LABELS[rarity]}
              </span>
            </div>
            <div className="w-px h-4 bg-white/20 shrink-0" />
            <nav className="flex items-center gap-4 flex-wrap">
              <Link href="/leaderboard"
                className="text-white/65 hover:text-white text-sm font-medium transition-colors whitespace-nowrap">
                Leaderboard
              </Link>
              <Link href="/collection"
                className="text-white/65 hover:text-white text-sm font-medium transition-colors whitespace-nowrap">
                My Collection
              </Link>
              <Link href="/profile"
                className="text-white/65 hover:text-white text-sm font-medium transition-colors whitespace-nowrap">
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

      {/* ── Content ─────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-8 py-8">

        {bounty && <BountyCard bounty={bounty} />}

        {officeRows.length === 0 ? (
          <p className="text-[#2D1B4E]/50">
            No offices set up yet.{" "}
            <a href="/admin" className="text-[#C8102E] underline">Go to admin</a>{" "}
            to get started.
          </p>
        ) : (
          <>
            <p className="text-[9px] font-black tracking-[0.2em] uppercase text-[#2D1B4E]/40 mb-5">
              Choose an office
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {officeRows.map((office) => {
                const pct =
                  office.total_count > 0
                    ? Math.round((office.met_count / office.total_count) * 100)
                    : 0;
                const done = pct === 100 && office.total_count > 0;
                return (
                  <Link
                    key={office.name}
                    href={`/office/${office.slug}`}
                    className="group flex flex-col gap-3 p-5 bg-white rounded-2xl border border-[#2D1B4E]/10 shadow-sm hover:shadow-lg hover:border-[#C8102E]/30 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-[#2D1B4E] text-lg leading-tight group-hover:text-[#C8102E] transition-colors truncate">
                          {office.name}
                        </p>
                        {office.description && (
                          <p className="text-xs text-[#2D1B4E]/40 mt-0.5 truncate">{office.description}</p>
                        )}
                      </div>
                      <span
                        className="text-lg font-black tabular-nums shrink-0"
                        style={{ color: done ? "#16a34a" : "#C8102E" }}
                      >
                        {pct}%
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-[#2D1B4E]/40 mb-2">
                        {office.met_count} of {office.total_count} connected
                      </p>
                      <div className="w-full rounded-full h-1.5 overflow-hidden bg-[#2D1B4E]/8">
                        <div
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            background: done ? "#16a34a" : "#C8102E",
                          }}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
