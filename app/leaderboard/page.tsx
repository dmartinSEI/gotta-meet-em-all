import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth, signOut } from "../../auth";
import { sql } from "@/lib/db";
import { getRarity, RARITY_LABELS, type Rarity } from "@/lib/xp";

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
  common:    "rgba(45,27,78,0.25)",
  uncommon:  "#4ade80",
  rare:      "#60a5fa",
  epic:      "#c084fc",
  legendary: "#fbbf24",
};

const RARITY_ROW_BADGE: Record<Rarity, { bg: string; color: string }> = {
  common:    { bg: "rgba(45,27,78,0.06)",  color: "rgba(45,27,78,0.45)" },
  uncommon:  { bg: "rgba(74,222,128,0.12)", color: "#15803d" },
  rare:      { bg: "rgba(96,165,250,0.12)", color: "#1d4ed8" },
  epic:      { bg: "rgba(192,132,252,0.12)", color: "#7e22ce" },
  legendary: { bg: "rgba(251,191,36,0.15)", color: "#b45309" },
};

const AVATAR_COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f97316",
  "#ec4899", "#14b8a6", "#6366f1", "#f43f5e",
];

const MEDAL = ["🥇", "🥈", "🥉"];

const PODIUM_STYLES = [
  { order: 1, height: 80,  bg: "linear-gradient(180deg, #64748b 0%, #475569 100%)" }, // 2nd — silver
  { order: 0, height: 112, bg: "linear-gradient(180deg, #f59e0b 0%, #d97706 100%)" }, // 1st — gold
  { order: 2, height: 56,  bg: "linear-gradient(180deg, #c2410c 0%, #9a3412 100%)" }, // 3rd — bronze
] as const;

const PODIUM_COL_ORDER = [1, 0, 2]; // show 2nd, 1st, 3rd

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

export default async function LeaderboardPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  const { rows } = await sql<LeaderboardEntry>`
    SELECT
      c.first_name,
      c.last_name,
      c.email,
      c.office,
      c.photo_url,
      COALESCE(SUM(
        CASE ca.level WHEN 1 THEN 10 WHEN 2 THEN 25 WHEN 3 THEN 50 ELSE 0 END
      ), 0)::int
      + COALESCE((
          SELECT SUM(b.bonus_xp) FROM bounties b
          WHERE b.user_id = u.id AND b.completed_at IS NOT NULL
        ), 0)::int AS total_xp,
      COUNT(ca.consultant_id)::int AS total_met,
      (SELECT COUNT(*)::int FROM consultants) AS roster_size
    FROM consultants c
    JOIN users u ON u.email = c.email
    LEFT JOIN catches ca ON ca.user_id = u.id
    GROUP BY c.id, c.first_name, c.last_name, c.email, c.office, c.photo_url, u.id
    ORDER BY total_xp DESC, total_met DESC, c.last_name, c.first_name
  `;

  const viewerRow    = rows.find((r) => r.email === session.user!.email);
  const viewerRank   = viewerRow ? rows.indexOf(viewerRow) + 1 : null;
  const viewerXp     = viewerRow?.total_xp ?? 0;
  const rosterSize   = rows[0]?.roster_size ?? 0;
  const viewerRarity = getRarity(viewerXp, rosterSize);
  const top3         = rows.slice(0, 3);
  const topXp        = rows[0]?.total_xp ?? 1;

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

        <div className="relative max-w-3xl mx-auto px-8 py-5 flex items-center justify-between gap-6">
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
              <span className="text-white/50 text-sm tabular-nums">{viewerXp} XP</span>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${HEADER_RARITY[viewerRarity]}`}>
                {RARITY_LABELS[viewerRarity]}
              </span>
            </div>
            <div className="w-px h-4 bg-white/20 shrink-0" />
            <nav className="flex items-center gap-4 flex-wrap">
              <Link href="/" className="text-white/65 hover:text-white text-sm font-medium transition-colors whitespace-nowrap">
                Offices
              </Link>
              <Link href="/leaderboard" className="text-white text-sm font-semibold whitespace-nowrap">
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

      {/* ── Content ─────────────────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-8 py-8">

        {rows.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-[#2D1B4E] font-bold mb-1">No one has started yet.</p>
            <p className="text-sm" style={{ color: "rgba(45,27,78,0.40)" }}>Be the first to meet a colleague.</p>
          </div>
        ) : (
          <>
            {/* ── Podium ──────────────────────────────────────────── */}
            {top3.length > 0 && (
              <div className="flex items-end justify-center gap-6 mb-10">
                {PODIUM_COL_ORDER.map((rankIdx) => {
                  const entry = top3[rankIdx];
                  if (!entry) return null;
                  const style   = PODIUM_STYLES[rankIdx];
                  const rank    = rankIdx + 1;
                  const isSelf  = entry.email === session.user!.email;
                  const fullName = `${entry.first_name} ${entry.last_name}`;
                  const rarity  = getRarity(entry.total_xp, rosterSize);
                  const pct     = rosterSize > 0 ? Math.round((entry.total_met / rosterSize) * 100) : 0;

                  return (
                    <div key={entry.email} className="flex flex-col items-center gap-2 flex-1"
                         style={{ transform: isSelf ? "scale(1.06)" : undefined }}>

                      {/* Avatar */}
                      <div className="relative">
                        <div style={{
                          borderRadius: "50%", padding: 3,
                          background: isSelf ? "#C8102E" : "rgba(45,27,78,0.12)",
                        }}>
                          <Avatar name={fullName} photoUrl={entry.photo_url} size={rank === 1 ? 68 : 52} />
                        </div>
                        <span className="absolute -top-2 -right-1 text-xl leading-none">{MEDAL[rankIdx]}</span>
                      </div>

                      {/* Name */}
                      <div className="text-center">
                        <p className="font-black text-sm leading-tight text-[#2D1B4E]">
                          {entry.first_name}
                          {isSelf && <span style={{ color: "#C8102E" }}> ★</span>}
                        </p>
                        <p className="text-[10px]" style={{ color: "rgba(45,27,78,0.40)" }}>{entry.office}</p>
                      </div>

                      {/* Rarity badge */}
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: RARITY_ROW_BADGE[rarity].bg, color: RARITY_ROW_BADGE[rarity].color }}
                      >
                        {RARITY_LABELS[rarity]}
                      </span>

                      {/* Podium block */}
                      <div
                        className="w-full rounded-t-xl flex flex-col items-center justify-start pt-3 gap-0.5"
                        style={{ height: style.height, background: style.bg }}
                      >
                        <p className="text-white font-black text-sm tabular-nums">{entry.total_xp} XP</p>
                        <p className="text-white/65 text-[10px] tabular-nums">{entry.total_met} met · {pct}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Your rank callout (if outside top 3) ────────────── */}
            {viewerRank && viewerRank > 3 && (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl mb-6"
                style={{ background: "rgba(200,16,46,0.06)", border: "1.5px solid rgba(200,16,46,0.18)" }}
              >
                <span className="text-sm font-black text-[#C8102E] tabular-nums">#{viewerRank}</span>
                <p className="text-sm font-semibold text-[#2D1B4E]">Your current rank</p>
                <span className="ml-auto text-xs tabular-nums" style={{ color: "rgba(45,27,78,0.45)" }}>
                  {viewerXp} XP
                </span>
              </div>
            )}

            {/* ── Ranked list ─────────────────────────────────────── */}
            <div className="flex flex-col gap-1.5">
              {rows.map((entry, i) => {
                const rank     = i + 1;
                const isSelf   = entry.email === session.user!.email;
                const fullName = `${entry.first_name} ${entry.last_name}`;
                const rarity   = getRarity(entry.total_xp, rosterSize);
                const barPct   = topXp > 0 ? Math.round((entry.total_xp / topXp) * 100) : 0;
                const catchPct = rosterSize > 0 ? Math.round((entry.total_met / rosterSize) * 100) : 0;

                return (
                  <div
                    key={entry.email}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
                    style={isSelf
                      ? { background: "#2D1B4E", border: "1.5px solid #2D1B4E" }
                      : { background: "#fff", border: "1.5px solid rgba(45,27,78,0.08)" }
                    }
                  >
                    {/* Rank */}
                    <span
                      className="w-7 text-sm font-black tabular-nums shrink-0 text-center"
                      style={{ color: isSelf ? "rgba(255,255,255,0.60)" : rank <= 3 ? "#2D1B4E" : "rgba(45,27,78,0.30)" }}
                    >
                      {rank <= 3 ? MEDAL[rank - 1] : `#${rank}`}
                    </span>

                    {/* Avatar with rarity ring */}
                    <div style={{
                      borderRadius: "50%", padding: 2, flexShrink: 0,
                      background: isSelf ? "rgba(255,255,255,0.15)" : RARITY_RING[rarity],
                    }}>
                      <Avatar name={fullName} photoUrl={entry.photo_url} size={34} />
                    </div>

                    {/* Name + office + XP bar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <p
                          className="font-bold text-sm leading-tight truncate"
                          style={{ color: isSelf ? "#fff" : "#2D1B4E" }}
                        >
                          {fullName}
                        </p>
                        {isSelf && (
                          <span className="text-[10px] font-semibold shrink-0" style={{ color: "rgba(255,255,255,0.50)" }}>
                            you
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] truncate mt-0.5" style={{ color: isSelf ? "rgba(255,255,255,0.45)" : "rgba(45,27,78,0.38)" }}>
                        {entry.office}
                      </p>
                      <div
                        className="mt-1.5 w-full rounded-full overflow-hidden"
                        style={{ height: 3, background: isSelf ? "rgba(255,255,255,0.12)" : "rgba(45,27,78,0.06)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${barPct}%`,
                            background: isSelf ? "rgba(255,255,255,0.50)" : RARITY_BAR[rarity],
                          }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={isSelf
                          ? { background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.75)" }
                          : { background: RARITY_ROW_BADGE[rarity].bg, color: RARITY_ROW_BADGE[rarity].color }
                        }
                      >
                        {RARITY_LABELS[rarity]}
                      </span>
                      <p
                        className="text-sm font-black tabular-nums"
                        style={{ color: isSelf ? "#fff" : "#2D1B4E" }}
                      >
                        {entry.total_xp} XP
                      </p>
                      <p
                        className="text-[11px] tabular-nums"
                        style={{ color: isSelf ? "rgba(255,255,255,0.45)" : "rgba(45,27,78,0.38)" }}
                      >
                        {entry.total_met} met · {catchPct}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
