import { sql } from "./db";

export interface BountyRow {
  id: number;
  consultant_id: number;
  month: string;
  completed_at: string | null;
  bonus_xp: number;
  first_name: string;
  last_name: string;
  title: string;
  office: string;
  photo_url: string;
}

export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function daysLeftInMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return Math.max(0, Math.ceil((lastDay.getTime() - now.getTime()) / 86_400_000));
}

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
