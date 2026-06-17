"use server";

import { sql } from "@/lib/db";
import { auth } from "../auth";
import { revalidatePath } from "next/cache";
import { currentMonth } from "@/lib/bounty";
import { checkAndAwardBadges } from "@/lib/badges";
import type { BadgeInfo } from "@/lib/types";

type ActionResult = { success: boolean; newBadges: BadgeInfo[] };

export async function catchConsultant(consultantId: number): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");

    await sql`
      INSERT INTO catches (user_id, consultant_id, level)
      SELECT id, ${consultantId}, 1
      FROM users
      WHERE email = ${session.user.email}
      ON CONFLICT (user_id, consultant_id) DO NOTHING
    `;

    // Complete the monthly bounty if this is the target consultant
    await sql`
      UPDATE bounties
      SET completed_at = NOW()
      WHERE user_id = (SELECT id FROM users WHERE email = ${session.user.email})
        AND consultant_id = ${consultantId}
        AND month = ${currentMonth()}
        AND completed_at IS NULL
    `;

    const newBadges = await checkAndAwardBadges(session.user.email).catch(() => []);

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

    await sql`
      UPDATE catches
      SET level = ${newLevel}
      WHERE consultant_id = ${consultantId}
        AND user_id = (SELECT id FROM users WHERE email = ${session.user.email})
        AND level < ${newLevel}
    `;

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

    await sql`
      DELETE FROM catches
      WHERE consultant_id = ${consultantId}
        AND user_id = (SELECT id FROM users WHERE email = ${session.user.email})
    `;

    // Reverse the bounty completion if this was the monthly target
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
