"use server";

import { sql } from "@/lib/db";
import { auth } from "../auth";
import { revalidatePath } from "next/cache";
import { currentMonth } from "@/lib/bounty";
import { checkAndAwardBadges } from "@/lib/badges";
import { XP_PER_LEVEL } from "@/lib/xp";
import type { BadgeInfo } from "@/lib/types";

type ActionResult = { success: boolean; newBadges: BadgeInfo[] };

export async function catchConsultant(consultantId: number, level: 1 | 2 | 3 = 1): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");

    const result = await sql`
      INSERT INTO catches (user_id, consultant_id, level)
      SELECT id, ${consultantId}, ${level}
      FROM users
      WHERE email = ${session.user.email}
      ON CONFLICT (user_id, consultant_id) DO NOTHING
    `;

    if (result.rowCount && result.rowCount > 0) {
      await sql`
        INSERT INTO catch_events (user_id, consultant_id, xp_gained)
        SELECT id, ${consultantId}, ${XP_PER_LEVEL[level]}
        FROM users WHERE email = ${session.user.email}
      `;
    }

    await sql`
      UPDATE bounties
      SET completed_at = NOW()
      WHERE user_id = (SELECT id FROM users WHERE email = ${session.user.email})
        AND consultant_id = ${consultantId}
        AND month = ${currentMonth()}
        AND completed_at IS NULL
    `;

    // Check badges for the catcher
    const newBadges = await checkAndAwardBadges(session.user.email).catch(() => []);

    // Fire-and-forget: check recognized badges for the person being caught
    const { rows: caughtRows } = await sql<{ email: string }>`
      SELECT email FROM consultants WHERE id = ${consultantId}
    `;
    const caughtEmail = caughtRows[0]?.email;
    if (caughtEmail && caughtEmail !== session.user.email) {
      checkAndAwardBadges(caughtEmail).catch(() => {});
    }

    revalidatePath("/", "layout");
    return { success: true, newBadges };
  } catch (error) {
    console.error("Failed to catch:", error);
    return { success: false, newBadges: [] };
  }
}

export async function upgradeConsultant(consultantId: number, newLevel: 2 | 3): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");

    // Fetch current level so we can compute the XP delta
    const { rows } = await sql<{ level: number }>`
      SELECT ca.level FROM catches ca
      JOIN users u ON u.id = ca.user_id
      WHERE ca.consultant_id = ${consultantId}
        AND u.email = ${session.user.email}
    `;
    const currentLevel = rows[0]?.level as 1 | 2 | 3 | undefined;

    const result = await sql`
      UPDATE catches
      SET level = ${newLevel}
      WHERE consultant_id = ${consultantId}
        AND user_id = (SELECT id FROM users WHERE email = ${session.user.email})
        AND level < ${newLevel}
    `;

    if (result.rowCount && result.rowCount > 0 && currentLevel) {
      const xpDelta = XP_PER_LEVEL[newLevel] - XP_PER_LEVEL[currentLevel];
      await sql`
        INSERT INTO catch_events (user_id, consultant_id, xp_gained)
        SELECT id, ${consultantId}, ${xpDelta}
        FROM users WHERE email = ${session.user.email}
      `;
    }

    const newBadges = await checkAndAwardBadges(session.user.email).catch(() => []);
    revalidatePath("/", "layout");
    return { success: true, newBadges };
  } catch (error) {
    console.error("Failed to upgrade:", error);
    return { success: false, newBadges: [] };
  }
}

export async function uncatchConsultant(consultantId: number): Promise<{ success: boolean }> {
  try {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");

    // Remove XP events first (no FK cascade from catches → catch_events)
    await sql`
      DELETE FROM catch_events
      WHERE consultant_id = ${consultantId}
        AND user_id = (SELECT id FROM users WHERE email = ${session.user.email})
    `;

    await sql`
      DELETE FROM catches
      WHERE consultant_id = ${consultantId}
        AND user_id = (SELECT id FROM users WHERE email = ${session.user.email})
    `;

    await sql`
      UPDATE bounties
      SET completed_at = NULL
      WHERE user_id = (SELECT id FROM users WHERE email = ${session.user.email})
        AND consultant_id = ${consultantId}
        AND month = ${currentMonth()}
        AND completed_at IS NOT NULL
    `;

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to uncatch:", error);
    return { success: false };
  }
}
