import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "../../../auth";
import { sql } from "@/lib/db";
import ConsultantGrid from "../../ConsultantGrid";
import type { ConsultantRow } from "@/lib/types";
import { getRarity, RARITY_LABELS, RARITY_BADGE_STYLES, XP_PER_LEVEL } from "@/lib/xp";

const GATEWAY_THRESHOLD = 0.8;

interface OfficeRecord {
  name: string;
  slug: string;
  lock_type: "none" | "gateway";
  description: string;
}

export default async function OfficePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  const { rows: officeRows } = await sql<OfficeRecord>`
    SELECT name, slug, lock_type, description
    FROM offices
    WHERE slug = ${slug}
    LIMIT 1
  `;
  if (officeRows.length === 0) redirect("/");
  const office = officeRows[0];

  // Global XP for header badge
  const { rows: xpRows } = await sql`
    SELECT COALESCE(SUM(
      CASE ca.level WHEN 1 THEN 10 WHEN 2 THEN 25 WHEN 3 THEN 50 ELSE 0 END
    ), 0)::int AS total_xp
    FROM catches ca
    JOIN users u ON u.id = ca.user_id
    WHERE u.email = ${session.user.email}
  `;
  const totalXp: number = (xpRows[0] as { total_xp: number } | undefined)?.total_xp ?? 0;

  // Enforce gateway lock: user must have met ≥80% of every free office
  if (office.lock_type === "gateway") {
    const { rows: freeStats } = await sql`
      SELECT
        COUNT(c.id)::int          AS total_count,
        COUNT(ca.consultant_id)::int AS met_count
      FROM offices o
      LEFT JOIN consultants c ON c.office = o.name
      LEFT JOIN catches ca
        ON  ca.consultant_id = c.id
        AND ca.user_id = (SELECT id FROM users WHERE email = ${session.user.email})
      WHERE o.lock_type = 'none'
      GROUP BY o.name
    `;
    const gatewayUnlocked =
      freeStats.length === 0 ||
      (freeStats as { total_count: number; met_count: number }[]).every(
        (s) => s.total_count === 0 || s.met_count >= Math.ceil(s.total_count * GATEWAY_THRESHOLD)
      );
    if (!gatewayUnlocked) redirect("/");
  }

  // Consultants in this office with the viewer's catch data
  const { rows } = await sql<ConsultantRow>`
    SELECT
      c.id,
      c.first_name,
      c.last_name,
      c.title,
      c.office,
      c.bio,
      c.skills,
      c.photo_url,
      c.photo_url_l1,
      c.photo_url_l2,
      c.photo_url_l3,
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

  // Global rarity (all XP vs all consultants) shown in the header
  const { rows: rosterRows } = await sql`SELECT COUNT(*)::int AS n FROM consultants`;
  const globalRosterSize = (rosterRows[0] as { n: number } | undefined)?.n ?? 0;
  const globalRarity = getRarity(totalXp, globalRosterSize);

  // Office-specific XP (for rarity on own card border within this office)
  const officeXp = rows.reduce((sum, c) => {
    if (!c.catch_level) return sum;
    return sum + XP_PER_LEVEL[c.catch_level as 1 | 2 | 3];
  }, 0);
  const officeRarity = getRarity(officeXp, total);

  return (
    <main className="p-8 max-w-6xl mx-auto">
      {/* Header */}
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
          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <button className="text-sm text-gray-400 hover:text-gray-600">Sign out</button>
          </form>
        </div>
      </div>

      {total === 0 ? (
        <p className="text-gray-500">
          No consultants in this office yet.{" "}
          <a href="/admin" className="text-blue-600 underline">
            Upload the roster
          </a>{" "}
          to get started.
        </p>
      ) : (
        <>
          {/* Progress bar */}
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

          <ConsultantGrid consultants={rows} rosterSize={total} viewerRarity={officeRarity} />
        </>
      )}
    </main>
  );
}
