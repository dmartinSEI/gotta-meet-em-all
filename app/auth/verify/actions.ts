"use server";

import { sql } from "@/lib/db";

export async function resolveTicket(ticket: string) {
  const { rows } = await sql<{ url: string; created_at: string }>`
    DELETE FROM link_tickets WHERE ticket = ${ticket} RETURNING url, created_at
  `;

  if (rows.length === 0) {
    throw new Error("This sign-in link has already been used or is invalid.");
  }

  const ageMs = Date.now() - new Date(rows[0].created_at).getTime();
  if (ageMs > 60 * 60 * 1000) {
    throw new Error("This sign-in link has expired. Please request a new one.");
  }

  return { url: rows[0].url };
}
