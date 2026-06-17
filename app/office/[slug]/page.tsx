import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "../../../auth";
import { sql } from "@/lib/db";
import ConsultantGrid from "../../ConsultantGrid";
import type { ConsultantRow } from "@/lib/types";
import { getRarity, RARITY_LABELS, RARITY_BADGE_STYLES, XP_PER_LEVEL } from "@/lib/xp";

interface OfficeRecord {
  name: string;
  slug: string;
  description: string;
}

interface GlobalStats {
  total_xp: number;
  roster_size: number;
}

export default async function OfficePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  // Batch 1: office lookup + global stats in parallel
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

  // Batch 2: consultants for this office
  const { rows } = await sql<ConsultantRow>`
    SELECT
      c.id, c.first_name, c.last_name, c.title, c.office, c.bio, c.skills,
      c.photo_url, c.photo_url_l1, c.photo_url_l2, c.photo_url_l3,
      (c.email = ${session.user.email}) AS is_own_card,
      (
        SELECT ca.level FROM catches ca
        JOIN users u ON u.id = ca.user_id
        WHERE ca.consultant_id = c.id
          AND u.email = ${session.user.email}
      ) AS catch_level
    FROM consultants c
    WHERE c.office = ${office.name}
    ORDER BY c.last_name, c.first_name
  `;

  const total = rows.length;
  const met = rows.filter((c) => c.catch_level !== null).length;
  const pct = total > 0 ? Math.round((met / total) * 100) : 0;

  const globalRarity = getRarity(totalXp, globalRosterSize);

  const officeXp = rows.reduce((sum, c) => {
    if (!c.catch_level) return sum;
    return sum + XP_PER_LEVEL[c.catch_level as 1 | 2 | 3];
  }, 0);
  const officeRarity = getRarity(officeXp, total);

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Offices
          </Link>
          <h1 className="text-3xl font-bold">{office.name}</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/leaderboard" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            Leaderboard
          </Link>
          <Link href="/collection" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            My Collection
          </Link>
          <Link href="/profile" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            My Profile
          </Link>
          <form action={async () => { "use server"; await signOut(); }}>
            <button className="text-sm text-gray-400 hover:text-gray-600">Sign out</button>
          </form>
        </div>
      </div>

      {total === 0 ? (
        <p className="text-gray-500">
          No consultants in this office yet.{" "}
          <a href="/admin" className="text-blue-600 underline">Upload the roster</a>{" "}
          to get started.
        </p>
      ) : (
        <>
          <div className="mb-8 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {met} of {total} met &mdash; {pct}%
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">{totalXp} XP</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${RARITY_BADGE_STYLES[globalRarity]}`}>
                  {RARITY_LABELS[globalRarity]}
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <ConsultantGrid consultants={rows} viewerRarity={officeRarity} />
        </>
      )}
    </main>
  );
}
