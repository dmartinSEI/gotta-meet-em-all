import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "../../auth";
import { sql } from "@/lib/db";
import type { ConsultantRow } from "@/lib/types";
import { getRarity, RARITY_LABELS, RARITY_BADGE_STYLES, XP_PER_LEVEL } from "@/lib/xp";
import CollectionBinder from "./CollectionBinder";

export default async function CollectionPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  const [{ rows }, { rows: rosterRows }] = await Promise.all([
    sql<ConsultantRow>`
      SELECT
        c.id, c.first_name, c.last_name, c.title, c.office, c.bio, c.skills,
        c.photo_url, c.photo_url_l1, c.photo_url_l2, c.photo_url_l3,
        (c.email = ${session.user.email}) AS is_own_card,
        ca.level AS catch_level
      FROM consultants c
      JOIN catches ca ON ca.consultant_id = c.id
      JOIN users u ON u.id = ca.user_id
      WHERE u.email = ${session.user.email}
      ORDER BY c.office, c.last_name, c.first_name
    `,
    sql`SELECT COUNT(*)::int AS n FROM consultants`,
  ]);

  const totalRoster = (rosterRows[0] as { n: number } | undefined)?.n ?? 0;

  const totalXp = rows.reduce((sum, c) => {
    if (!c.catch_level) return sum;
    return sum + XP_PER_LEVEL[c.catch_level as 1 | 2 | 3];
  }, 0);

  const viewerRarity = getRarity(totalXp, totalRoster);

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Offices
          </Link>
          <h1 className="text-3xl font-bold">My Collection</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{totalXp} XP</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${RARITY_BADGE_STYLES[viewerRarity]}`}>
            {RARITY_LABELS[viewerRarity]}
          </span>
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

      {rows.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">📖</p>
          <p className="text-gray-500 text-lg font-medium">Your binder is empty.</p>
          <p className="text-sm text-gray-400 mt-1">Start meeting colleagues to fill it up!</p>
          <Link
            href="/"
            className="mt-5 inline-block text-sm text-blue-600 hover:underline font-medium"
          >
            Browse offices →
          </Link>
        </div>
      ) : (
        <CollectionBinder
          consultants={rows}
          totalRoster={totalRoster}
          viewerRarity={viewerRarity}
        />
      )}
    </main>
  );
}
