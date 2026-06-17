import Link from "next/link";
import { auth, signOut } from "../auth";
import { sql } from "@/lib/db";
import type { OfficeRow } from "@/lib/types";
import { getRarity, RARITY_LABELS, RARITY_BADGE_STYLES } from "@/lib/xp";

// Fraction of each free office a user must have met to unlock gateway offices.
const GATEWAY_THRESHOLD = 0.8;

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
        o.lock_type,
        o.description,
        o.sort_order,
        COUNT(c.id)::int          AS total_count,
        COUNT(ca.consultant_id)::int AS met_count
      FROM offices o
      LEFT JOIN consultants c ON c.office = o.name
      LEFT JOIN catches ca
        ON  ca.consultant_id = c.id
        AND ca.user_id = (SELECT id FROM users WHERE email = ${session.user.email})
      GROUP BY o.name, o.slug, o.lock_type, o.description, o.sort_order
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

  // Gateway offices unlock once the user has met ≥80% of every free office.
  const freeOffices = officeRows.filter((o) => o.lock_type === "none");
  const gatewayUnlocked =
    freeOffices.length === 0 ||
    freeOffices.every(
      (o) => o.total_count === 0 || o.met_count >= Math.ceil(o.total_count * GATEWAY_THRESHOLD)
    );

  return (
    <main className="p-8 max-w-5xl mx-auto">
      {/* Header */}
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

      {officeRows.length === 0 ? (
        <p className="text-gray-500">
          No offices set up yet.{" "}
          <a href="/admin" className="text-blue-600 underline">
            Go to admin
          </a>{" "}
          to get started.
        </p>
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-5">Choose an office to start meeting people.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {officeRows.map((office) => {
              const unlocked = office.lock_type === "none" || gatewayUnlocked;
              const pct =
                office.total_count > 0
                  ? Math.round((office.met_count / office.total_count) * 100)
                  : 0;

              if (unlocked) {
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
              }

              // Locked gateway office — show per-free-office progress
              return (
                <div
                  key={office.name}
                  className="flex flex-col gap-3 p-5 bg-gray-50 rounded-2xl border border-gray-100 select-none"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-gray-400 text-lg leading-tight">{office.name}</p>
                      {office.description && (
                        <p className="text-xs text-gray-300 mt-0.5">{office.description}</p>
                      )}
                    </div>
                    <span className="text-lg mt-0.5">🔒</span>
                  </div>

                  <p className="text-xs text-gray-400">
                    Meet 80% of each home office to unlock
                  </p>

                  <div className="flex flex-col gap-2">
                    {freeOffices.map((fo) => {
                      const required = Math.ceil(fo.total_count * GATEWAY_THRESHOLD);
                      const foMet = Math.min(fo.met_count, required);
                      const foPct = required > 0 ? Math.round((foMet / required) * 100) : 0;
                      const done = foMet >= required && required > 0;
                      return (
                        <div key={fo.name}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className={done ? "text-green-600 font-medium" : "text-gray-400"}>
                              {fo.name} {done ? "✓" : ""}
                            </span>
                            <span className="text-gray-400">
                              {foMet} / {required}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div
                              className={`h-1 rounded-full transition-all ${done ? "bg-green-400" : "bg-gray-400"}`}
                              style={{ width: `${foPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
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
