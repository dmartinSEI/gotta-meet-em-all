"use server";

import { auth } from "../../auth";
import { sql } from "@/lib/db";
import type { PreferredComm } from "@/lib/types";

const BIO_MAX = 500;
const CLIENT_MAX = 100;
const PAST_CLIENTS_MAX = 500;
const COMM_OPTIONS: PreferredComm[] = ["Email", "Teams", "Calendar Invite"];

export async function updateProfile(data: {
  bio: string;
  skills: string;
  current_client: string;
  past_clients: string;
  preferred_comm: string;
}) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const bio            = data.bio.trim().slice(0, BIO_MAX);
  const skills         = data.skills
    .split(",").map((s) => s.trim()).filter(Boolean)
    .slice(0, 5).join(", ");
  const current_client = data.current_client.trim().slice(0, CLIENT_MAX);
  const past_clients   = data.past_clients.trim().slice(0, PAST_CLIENTS_MAX);
  const preferred_comm = (COMM_OPTIONS as string[]).includes(data.preferred_comm)
    ? (data.preferred_comm as PreferredComm)
    : null;

  const result = await sql`
    UPDATE consultants
    SET bio            = ${bio},
        skills         = ${skills},
        current_client = ${current_client || null},
        past_clients   = ${past_clients || null},
        preferred_comm = ${preferred_comm}
    WHERE email = ${session.user.email}
  `;

  if (result.rowCount === 0) throw new Error("Consultant record not found for your email.");

  return { success: true };
}
