import { sql } from "./db";
export type { BountyRow } from "./bounty-client";
export { currentMonth, daysLeftInMonth } from "./bounty-client";
import type { BountyRow } from "./bounty-client";
import { currentMonth } from "./bounty-client";

export async function getOrAssignBounty(email: string): Promise<BountyRow | null> {
  const month = currentMonth();

  const existing = await sql<BountyRow>`
    SELECT b.id, b.consultant_id, b.month, b.completed_at, b.bonus_xp,
           c.first_name, c.last_name, c.title, c.office, c.photo_url
    FROM bounties b
    JOIN consultants c ON c.id = b.consultant_id
    JOIN users u ON u.id = b.user_id
    WHERE u.email = ${email} AND b.month = ${month}
    LIMIT 1
  `;
  if (existing.rows.length > 0) return existing.rows[0];

  // Assign a random consultant the user hasn't caught yet (excluding self)
  const candidate = await sql<{ id: number }>`
    SELECT c.id FROM consultants c
    WHERE c.email != ${email}
      AND c.id NOT IN (
        SELECT ca.consultant_id FROM catches ca
        JOIN users u ON u.id = ca.user_id
        WHERE u.email = ${email}
      )
    ORDER BY RANDOM()
    LIMIT 1
  `;
  if (candidate.rows.length === 0) return null;

  const consultantId = candidate.rows[0].id;

  await sql`
    INSERT INTO bounties (user_id, consultant_id, month)
    SELECT u.id, ${consultantId}, ${month}
    FROM users u
    WHERE u.email = ${email}
    ON CONFLICT (user_id, month) DO NOTHING
  `;

  const created = await sql<BountyRow>`
    SELECT b.id, b.consultant_id, b.month, b.completed_at, b.bonus_xp,
           c.first_name, c.last_name, c.title, c.office, c.photo_url
    FROM bounties b
    JOIN consultants c ON c.id = b.consultant_id
    JOIN users u ON u.id = b.user_id
    WHERE u.email = ${email} AND b.month = ${month}
    LIMIT 1
  `;
  return created.rows[0] ?? null;
}
