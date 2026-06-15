"use server";

import { auth } from "../../auth";
import { sql } from "@/lib/db";

const BIO_MAX = 500;
const SKILLS_MAX = 300;

export async function updateProfile(data: { bio: string; skills: string }) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const bio = data.bio.trim().slice(0, BIO_MAX);
  const skills = data.skills.trim().slice(0, SKILLS_MAX);

  const result = await sql`
    UPDATE consultants
    SET bio = ${bio}, skills = ${skills}
    WHERE email = ${session.user.email}
  `;

  if (result.rowCount === 0) throw new Error("Consultant record not found for your email.");

  return { success: true };
}
