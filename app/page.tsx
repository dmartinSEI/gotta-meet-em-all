import Link from "next/link";
import { auth, signOut } from "../auth";
import AnimatedAuthBackground from "./AnimatedAuthBackground";
import { sql } from "@/lib/db";
import type { OfficeRow } from "@/lib/types";
import { getRarity, RARITY_LABELS, type Rarity } from "@/lib/xp";
import { officeImageSrc } from "@/lib/cards";
import { getOrAssignBounty } from "@/lib/bounty";
import BountyCard from "./BountyCard";

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
      <AnimatedAuthBackground>
        <h1 className="text-white font-black text-5xl tracking-tight mb-3">SEI Gotta Meet Em&apos; All</h1>
        <p className="text-white/40 text-sm mb-10">Gamified colleague networking for the firm.</p>
        <a
          href="/auth/signin"
          className="px-7 py-3 bg-[#C8102E] text-white rounded-xl font-bold text-sm hover:bg-[#a50d25] transition-colors"
        >
          Sign in with SEI Email →
        </a>
      </AnimatedAuthBackground>
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
  const rarity           = getRarity(totalXp, globalRosterSize);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4fb" }}>

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
            <h1 className="text-white font-black text-lg leading-none tracking-tight whitespace-nowrap">
              SEI Gotta Meet Em&apos; All
            </h1>
          </div>

          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-white/50 text-sm tabular-nums">{totalXp} pts</span>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${HEADER_RARITY[rarity]}`}>
                {RARITY_LABELS[rarity]}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="w-px h-4 bg-white/20" />
              <nav className="flex items-center gap-4 flex-wrap">
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
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8">

        {bounty && <BountyCard bounty={bounty} />}

        {officeRows.length === 0 ? (
          <p style={{ color: "rgba(45,27,78,0.45)" }}>
            No offices set up yet.{" "}
            <a href="/admin" style={{ color: "#C8102E" }} className="underline">Go to admin</a>{" "}
            to get started.
          </p>
        ) : (
          <>
            <p className="font-black tracking-[0.2em] uppercase mb-6" style={{ fontSize: 9, color: "rgba(45,27,78,0.40)" }}>
              Choose an office
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {officeRows.map((office) => {
                const pct  = office.total_count > 0 ? Math.round((office.met_count / office.total_count) * 100) : 0;
                const done = pct === 100 && office.total_count > 0;
                const imgSrc = officeImageSrc(office.name);

                return (
                  <Link
                    key={office.name}
                    href={`/office/${office.slug}`}
                    className="group relative block overflow-hidden rounded-2xl select-none transition-all duration-200 hover:scale-[1.03] hover:-translate-y-[3px] hover:shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
                    style={{
                      aspectRatio: "3 / 2",
                      border: done
                        ? "1.5px solid rgba(34,197,94,0.35)"
                        : "1.5px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    {/* Office photo / gradient background */}
                    <div
                      className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.06]"
                      style={{
                        background: "linear-gradient(160deg, #1a0e36 0%, #2D1B4E 100%)",
                        ...(imgSrc ? {
                          backgroundImage: `url(${imgSrc})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        } : {}),
                      }}
                    />

                    {/* Gradient scrim — heavier at bottom for text legibility */}
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.30) 50%, rgba(0,0,0,0.10) 100%)" }}
                    />

                    {/* Top-right — percentage */}
                    <div className="absolute top-3 right-3">
                      <span
                        className="font-black tabular-nums leading-none"
                        style={{ fontSize: 20, color: done ? "#4ade80" : "rgba(255,255,255,0.90)", textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}
                      >
                        {pct}%
                      </span>
                    </div>

                    {/* Completion badge */}
                    {done && (
                      <div
                        className="absolute top-3 left-3 flex items-center gap-1 rounded-full px-2.5 py-1"
                        style={{ background: "rgba(34,197,94,0.20)", border: "1px solid rgba(34,197,94,0.40)" }}
                      >
                        <span style={{ color: "#4ade80", fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                          ✓ Complete
                        </span>
                      </div>
                    )}

                    {/* Bottom — office name + met count */}
                    <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-6">
                      <p className="text-white font-black leading-tight truncate" style={{ fontSize: 17 }}>
                        {office.name}
                      </p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                        {office.met_count} of {office.total_count} met
                        {office.description ? ` · ${office.description}` : ""}
                      </p>
                    </div>

                    {/* Progress bar pinned to bottom edge */}
                    <div className="absolute bottom-0 left-0 right-0" style={{ height: 3, background: "rgba(255,255,255,0.08)" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: done ? "#22c55e" : "#C8102E",
                          transition: "width 0.5s ease",
                        }}
                      />
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
