import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth, signOut } from "../../auth";
import { sql } from "@/lib/db";
import { getRarity, RARITY_LABELS, RARITY_BADGE_STYLES } from "@/lib/xp";

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

const AVATAR_COLORS = [
  "bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-orange-500",
  "bg-pink-500", "bg-teal-500", "bg-indigo-500", "bg-rose-500",
];

function avatar(name: string, photoUrl: string, sizePx: number) {
  if (photoUrl) {
    return (
      <div className="rounded-full overflow-hidden shrink-0" style={{ width: sizePx, height: sizePx }}>
        <Image src={photoUrl} alt={name} width={sizePx} height={sizePx} className="object-cover object-top" />
      </div>
    );
  }
  const initials = name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div
      className={`rounded-full shrink-0 flex items-center justify-center text-white font-bold ${color}`}
      style={{ width: sizePx, height: sizePx, fontSize: sizePx * 0.36 }}
    >
      {initials}
    </div>
  );
}

const MEDAL = ["🥇", "🥈", "🥉"];

const PODIUM_STYLES = [
  // 2nd (left)
  { order: 1, height: "h-20", bg: "from-slate-400 to-slate-500", ring: "ring-2 ring-slate-300" },
  // 1st (center — rendered first so it's in the middle with order-1)
  { order: 0, height: "h-28", bg: "from-yellow-400 to-amber-500", ring: "ring-2 ring-yellow-300" },
  // 3rd (right)
  { order: 2, height: "h-14", bg: "from-orange-400 to-orange-600", ring: "ring-2 ring-orange-300" },
] as const;

// Render order: 2nd (col 1), 1st (col 2), 3rd (col 3)
const PODIUM_COL_ORDER = [1, 0, 2]; // indices into top3 array: show 2nd, 1st, 3rd

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

  const viewerRow = rows.find((r) => r.email === session.user!.email);
  const viewerRank = viewerRow ? rows.indexOf(viewerRow) + 1 : null;
  const viewerXp = viewerRow?.total_xp ?? 0;
  const rosterSize = rows[0]?.roster_size ?? 0;
  const viewerRarity = getRarity(viewerXp, rosterSize);

  const top3 = rows.slice(0, 3);
  const topXp = rows[0]?.total_xp ?? 1;

  return (
    <main className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Offices
          </Link>
          <h1 className="text-3xl font-bold">Leaderboard</h1>
        </div>
        <div className="flex items-center gap-4">
          {viewerRank && (
            <span className="text-sm text-gray-400">
              You: <span className="font-semibold text-gray-600">#{viewerRank}</span>
            </span>
          )}
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${RARITY_BADGE_STYLES[viewerRarity]}`}>
            {RARITY_LABELS[viewerRarity]}
          </span>
          <Link href="/collection" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            My Collection
          </Link>
          <form action={async () => { "use server"; await signOut(); }}>
            <button className="text-sm text-gray-400 hover:text-gray-600">Sign out</button>
          </form>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-gray-500 text-center py-16">No one has started yet. Be the first!</p>
      ) : (
        <>
          {/* ── Podium ── */}
          {top3.length > 0 && (
            <div className="flex items-end justify-center gap-4 mb-10 px-4">
              {PODIUM_COL_ORDER.map((rankIdx) => {
                const entry = top3[rankIdx];
                if (!entry) return null;
                const style = PODIUM_STYLES[rankIdx];
                const rank = rankIdx + 1;
                const isSelf = entry.email === session.user!.email;
                const fullName = `${entry.first_name} ${entry.last_name}`;
                const rarity = getRarity(entry.total_xp, rosterSize);

                return (
                  <div
                    key={entry.email}
                    className={`flex flex-col items-center gap-2 flex-1 ${isSelf ? "scale-105" : ""}`}
                  >
                    {/* Avatar + medal */}
                    <div className="relative">
                      <div className={`rounded-full ${isSelf ? style.ring : ""}`}>
                        {avatar(fullName, entry.photo_url, rank === 1 ? 72 : 56)}
                      </div>
                      <span className="absolute -top-2 -right-2 text-lg leading-none">
                        {MEDAL[rankIdx]}
                      </span>
                    </div>

                    {/* Name */}
                    <div className="text-center">
                      <p className={`font-bold leading-tight text-sm ${isSelf ? "text-blue-600" : "text-gray-800"}`}>
                        {entry.first_name}
                      </p>
                      <p className="text-xs text-gray-400">{entry.office}</p>
                    </div>

                    {/* Rarity badge */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${RARITY_BADGE_STYLES[rarity]}`}>
                      {RARITY_LABELS[rarity]}
                    </span>

                    {/* Podium block */}
                    <div className={`w-full rounded-t-lg bg-gradient-to-b ${style.bg} flex flex-col items-center justify-start pt-2 gap-0.5 ${style.height}`}>
                      <p className="text-white font-black text-sm tabular-nums">{entry.total_xp} XP</p>
                      <p className="text-white/70 text-[10px]">{entry.total_met} met</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Ranked list ── */}
          <div className="flex flex-col gap-1">
            {rows.map((entry, i) => {
              const rank = i + 1;
              const isSelf = entry.email === session.user!.email;
              const fullName = `${entry.first_name} ${entry.last_name}`;
              const rarity = getRarity(entry.total_xp, rosterSize);
              const barPct = topXp > 0 ? Math.round((entry.total_xp / topXp) * 100) : 0;

              return (
                <div
                  key={entry.email}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isSelf
                      ? "bg-blue-50 border border-blue-200"
                      : "bg-white border border-gray-100 hover:border-gray-200"
                  }`}
                >
                  {/* Rank */}
                  <span
                    className={`w-7 text-sm font-bold tabular-nums shrink-0 ${
                      rank <= 3 ? "text-gray-700" : "text-gray-400"
                    }`}
                  >
                    {rank <= 3 ? MEDAL[rank - 1] : `#${rank}`}
                  </span>

                  {/* Avatar */}
                  {avatar(fullName, entry.photo_url, 36)}

                  {/* Name + office + XP bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold text-sm leading-tight truncate ${isSelf ? "text-blue-700" : "text-gray-800"}`}>
                        {fullName}
                        {isSelf && <span className="ml-1 text-xs font-normal text-blue-400">(you)</span>}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{entry.office}</p>
                    {/* XP bar */}
                    <div className="mt-1.5 w-full bg-gray-100 rounded-full h-1">
                      <div
                        className={`h-1 rounded-full ${isSelf ? "bg-blue-400" : "bg-gray-300"}`}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${RARITY_BADGE_STYLES[rarity]}`}>
                      {RARITY_LABELS[rarity]}
                    </span>
                    <p className="text-sm font-bold text-gray-700 tabular-nums">{entry.total_xp} XP</p>
                    <p className="text-xs text-gray-400 tabular-nums">{entry.total_met} met</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
