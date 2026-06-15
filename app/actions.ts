"use server";

import { sql } from "@/lib/db";
import { auth } from "../auth";
import { revalidatePath } from "next/cache";

export async function catchConsultant(consultantId: number) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      throw new Error("Unauthorized");
    }

    await sql`
      INSERT INTO catches (user_id, consultant_id)
      SELECT id, ${consultantId}
      FROM users
      WHERE email = ${session.user.email}
      ON CONFLICT (user_id, consultant_id) DO NOTHING
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to catch:", error);
    return { success: false };
  }
}

export async function uncatchConsultant(consultantId: number) {
  try {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");

    await sql`
      DELETE FROM catches
      WHERE consultant_id = ${consultantId}
        AND user_id = (SELECT id FROM users WHERE email = ${session.user.email})
    `;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to uncatch:", error);
    return { success: false };
  }
}
