import { auth, signOut } from "../auth";
import { sql } from "@/lib/db";
import ConsultantGrid from "./ConsultantGrid";
import type { ConsultantRow } from "@/lib/types";
import { getRarity, RARITY_LABELS, RARITY_BADGE_STYLES, XP_PER_LEVEL } from "@/lib/xp";

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
    ORDER BY c.last_name, c.first_name
  `;

  const total = rows.length;
  const met = rows.filter((c) => c.catch_level !== null).length;
  const pct = total > 0 ? Math.round((met / total) * 100) : 0;

  const totalXp = rows.reduce((sum, c) => {
    if (!c.catch_level) return sum;
    return sum + XP_PER_LEVEL[c.catch_level as 1 | 2 | 3];
  }, 0);

  const rarity = getRarity(totalXp, total);
  const rarityLabel = RARITY_LABELS[rarity];
  const rarityStyle = RARITY_BADGE_STYLES[rarity];

  return (
    <main className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Gotta Meet Em All</h1>
        <div className="flex items-center gap-4">
          <a href="/profile" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            My Profile
          </a>
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
          No consultants loaded yet.{" "}
          <a href="/admin" className="text-blue-600 underline">
            Upload the roster
          </a>{" "}
          to get started.
        </p>
      ) : (
        <>
          {/* Progress + XP bar */}
          <div className="mb-8 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {met} of {total} met &mdash; {pct}%
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">{totalXp} XP</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${rarityStyle}`}>
                  {rarityLabel}
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

          <ConsultantGrid consultants={rows} rosterSize={total} />
        </>
      )}
    </main>
  );
}
