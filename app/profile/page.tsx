import Link from "next/link";
import { auth, signOut } from "../../auth";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { getRarity, RARITY_LABELS, type Rarity } from "@/lib/xp";
import { ALL_BADGES } from "@/lib/badge-data";
import ProfileForm from "./ProfileForm";
import PhotoUpload from "./PhotoUpload";

const HEADER_RARITY: Record<Rarity, string> = {
  common:    "bg-white/10 text-white/80 border border-white/20",
  uncommon:  "bg-green-400/20 text-green-300 border border-green-400/40",
  rare:      "bg-blue-400/20 text-blue-300 border border-blue-400/40",
  epic:      "bg-purple-400/20 text-purple-200 border border-purple-400/40",
  legendary: "bg-yellow-400/20 text-yellow-300 border border-yellow-400/40",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/api/auth/signin?callbackUrl=/profile");

  const [{ rows: consultantRows }, { rows: badgeRows }, { rows: xpRows }, { rows: rosterRows }] =
    await Promise.all([
      sql<{
        first_name: string; last_name: string; title: string;
        office: string; bio: string; skills: string; photo_url: string;
      }>`
        SELECT first_name, last_name, title, office, bio, skills, photo_url
        FROM consultants
        WHERE email = ${session.user.email}
      `,
      sql<{ badge_id: string; earned_at: string }>`
        SELECT ub.badge_id, ub.earned_at
        FROM user_badges ub
        JOIN users u ON u.id = ub.user_id
        WHERE u.email = ${session.user.email}
        ORDER BY ub.earned_at ASC
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
      sql`SELECT COUNT(*)::int AS n FROM consultants`,
    ]);

  const totalXp: number = (xpRows[0] as { total_xp: number } | undefined)?.total_xp ?? 0;
  const totalRoster: number = (rosterRows[0] as { n: number } | undefined)?.n ?? 0;
  const rarity = getRarity(totalXp, totalRoster);
  const earnedMap = new Map(badgeRows.map((r) => [r.badge_id, r.earned_at]));
  const consultant = consultantRows[0] ?? null;

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
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${HEADER_RARITY[rarity]}`}>
                {RARITY_LABELS[rarity]}
              </span>
            </div>
            <div className="w-px h-4 bg-white/20 shrink-0" />
            <nav className="flex items-center gap-4 flex-wrap">
              <Link href="/" className="text-white/65 hover:text-white text-sm font-medium transition-colors whitespace-nowrap">
                Offices
              </Link>
              <Link href="/leaderboard" className="text-white/65 hover:text-white text-sm font-medium transition-colors whitespace-nowrap">
                Leaderboard
              </Link>
              <Link href="/collection" className="text-white/65 hover:text-white text-sm font-medium transition-colors whitespace-nowrap">
                My Collection
              </Link>
              <Link href="/profile" className="text-white text-sm font-semibold whitespace-nowrap">
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
      <main className="max-w-2xl mx-auto px-8 py-8">

        {!consultant ? (
          <div
            className="rounded-2xl p-6 text-sm mb-8"
            style={{ background: "rgba(200,16,46,0.06)", border: "1px solid rgba(200,16,46,0.15)" }}
          >
            <p className="font-semibold text-[#2D1B4E] mb-1">Your email isn&apos;t in the consultant roster yet.</p>
            <p style={{ color: "rgba(45,27,78,0.55)" }}>Ask an admin to upload the roster with your email address included.</p>
          </div>
        ) : (
          <>
            {/* Identity block */}
            <div className="mb-8 pb-8 border-b" style={{ borderColor: "rgba(45,27,78,0.08)" }}>
              <p className="text-2xl font-black text-[#2D1B4E] leading-tight">
                {consultant.first_name} {consultant.last_name}
              </p>
              {consultant.title && <p className="text-[#2D1B4E]/55 mt-0.5 text-sm">{consultant.title}</p>}
              {consultant.office && <p className="text-xs mt-0.5" style={{ color: "rgba(45,27,78,0.38)" }}>{consultant.office}</p>}
            </div>

            {/* Photo upload */}
            <div className="mb-8 pb-8 border-b" style={{ borderColor: "rgba(45,27,78,0.08)" }}>
              <p className="text-[9px] font-black tracking-[0.2em] uppercase text-[#2D1B4E]/40 mb-4">
                Profile photo
              </p>
              <PhotoUpload currentUrl={consultant.photo_url ?? null} />
            </div>

            {/* Bio + skills form */}
            <div className="mb-8">
              <p className="text-[9px] font-black tracking-[0.2em] uppercase text-[#2D1B4E]/40 mb-4">
                About you
              </p>
              <ProfileForm initialBio={consultant.bio ?? ""} initialSkills={consultant.skills ?? ""} />
            </div>
          </>
        )}

        {/* Badges */}
        <div className="pt-8 border-t" style={{ borderColor: "rgba(45,27,78,0.08)" }}>
          <div className="flex items-center justify-between mb-5">
            <p className="text-[9px] font-black tracking-[0.2em] uppercase text-[#2D1B4E]/40">
              Achievements
            </p>
            <span className="text-xs tabular-nums" style={{ color: "rgba(45,27,78,0.40)" }}>
              {earnedMap.size} / {ALL_BADGES.length}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {ALL_BADGES.map((badge) => {
              const earnedAt = earnedMap.get(badge.id);
              const earned = earnedAt !== undefined;
              return (
                <div
                  key={badge.id}
                  className="flex items-start gap-3 p-4 rounded-xl border transition-colors"
                  style={earned
                    ? { background: "rgba(251,191,36,0.06)", borderColor: "rgba(251,191,36,0.25)" }
                    : { background: "rgba(45,27,78,0.03)", borderColor: "rgba(45,27,78,0.07)", opacity: 0.5 }
                  }
                >
                  <span className={`text-2xl leading-none mt-0.5 ${earned ? "" : "grayscale"}`}>
                    {badge.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm leading-tight text-[#2D1B4E]">{badge.name}</p>
                    <p className="text-xs mt-0.5 leading-snug" style={{ color: "rgba(45,27,78,0.50)" }}>
                      {badge.description}
                    </p>
                    {earned && earnedAt && (
                      <p className="text-[10px] mt-1" style={{ color: "#C8102E" }}>
                        Earned {new Date(earnedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
