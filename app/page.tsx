import Link from "next/link";
import { auth, signOut } from "../auth";
import { sql } from "@/lib/db";
import type { OfficeRow } from "@/lib/types";
import { getRarity, RARITY_LABELS, RARITY_BADGE_STYLES } from "@/lib/xp";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user?.email) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-4xl font-bold">Gotta Meet Em All</h1>
        <p className="text-gray-500">Sign in to start meeting your colleagues.</p>
        <a
          href="/api/auth/signin"
          className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
        >
          Sign In
        </a>
      </main>
    );
  }

  const [{ rows: officeRows }, { rows: xpRows }] = await Promise.all([
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
      SELECT COALESCE(SUM(
        CASE ca.level WHEN 1 THEN 10 WHEN 2 THEN 25 WHEN 3 THEN 50 ELSE 0 END
      ), 0)::int AS total_xp
      FROM catches ca
      JOIN users u ON u.id = ca.user_id
      WHERE u.email = ${session.user.email}
    `,
  ]);

  const totalXp: number = (xpRows[0] as { total_xp: number } | undefined)?.total_xp ?? 0;
  const globalRosterSize = officeRows.reduce((sum, o) => sum + o.total_count, 0);
  const rarity = getRarity(totalXp, globalRosterSize);

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl font-bold">Gotta Meet Em All</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{totalXp} XP</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${RARITY_BADGE_STYLES[rarity]}`}>
            {RARITY_LABELS[rarity]}
          </span>
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

      {officeRows.length === 0 ? (
        <p className="text-gray-500">
          No offices set up yet.{" "}
          <a href="/admin" className="text-blue-600 underline">Go to admin</a>{" "}
          to get started.
        </p>
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-5">Choose an office to start meeting people.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {officeRows.map((office) => {
              const pct =
                office.total_count > 0
                  ? Math.round((office.met_count / office.total_count) * 100)
                  : 0;
              return (
                <Link
                  key={office.name}
                  href={`/office/${office.slug}`}
                  className="flex flex-col gap-3 p-5 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
                >
                  <div>
                    <p className="font-bold text-gray-900 text-lg leading-tight">{office.name}</p>
                    {office.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{office.description}</p>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {office.met_count} / {office.total_count} met &mdash; {pct}%
                  </p>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
