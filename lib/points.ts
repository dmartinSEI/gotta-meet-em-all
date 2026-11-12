// Server-only: reads the `user_points` view (db/migrations/add_user_points_view.sql),
// the single source of truth for all-time points (meets + bounties + onboarding).
// Kept out of lib/xp.ts because client components import that file.
import { sql } from "./db";

export async function getUserPoints(email: string): Promise<number> {
  const { rows } = await sql<{ total_points: number }>`
    SELECT total_points FROM user_points WHERE email = ${email}
  `;
  return rows[0]?.total_points ?? 0;
}
