"use server";

import * as XLSX from "xlsx";
import { put } from "@vercel/blob";
import { pool } from "@/lib/db";
import { sql } from "@/lib/db";
import { auth } from "../../auth";
import type { Consultant } from "@/lib/types";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (!adminEmails.includes(session.user.email)) throw new Error("Forbidden");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

async function insertConsultants(consultants: Consultant[]) {
  const valid = consultants.filter(
    (c) => c.email && EMAIL_RE.test(c.email) && c.first_name && c.last_name
  );
  if (valid.length === 0) return { success: true as const, count: 0 };

  const params: string[] = [];
  const placeholders = valid.map((c, i) => {
    const base = i * 5;
    params.push(c.email, c.first_name, c.last_name, c.title ?? "", c.office ?? "");
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
  });

  await pool.query(
    `INSERT INTO consultants (email, first_name, last_name, title, office)
     VALUES ${placeholders.join(", ")}
     ON CONFLICT (email) DO UPDATE SET
       first_name = EXCLUDED.first_name,
       last_name = EXCLUDED.last_name,
       title = EXCLUDED.title,
       office = EXCLUDED.office`,
    params
  );

  return { success: true as const, count: valid.length };
}

// Called directly with pre-parsed data (e.g. from tests or other server code)
export async function saveConsultants(consultants: Consultant[]) {
  try {
    await requireAdmin();
    return await insertConsultants(consultants);
  } catch (error) {
    console.error("saveConsultants error:", error);
    return { success: false as const, error: "Failed to save to database." };
  }
}

// Called from the admin upload form with a raw FormData containing an .xlsx file
export async function importConsultants(formData: FormData) {
  try {
    await requireAdmin();

    const file = formData.get("file") as File;
    if (!file || file.size === 0) return { success: false as const, error: "No file selected." };
    if (file.size > MAX_FILE_BYTES) {
      return { success: false as const, error: "File is too large. Max size is 5MB." };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });

    if (rawRows.length === 0) return { success: false as const, error: "File appears empty." };

    // Normalize column names to lowercase so Excel headers like "Email" and "First_Name" match our schema
    const rows: Consultant[] = rawRows.map((row) =>
      Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase(), v])) as unknown as Consultant
    );

    return await insertConsultants(rows);
  } catch (error) {
    console.error("importConsultants error:", error);
    return { success: false as const, error: "Import failed. Check the file format and try again." };
  }
}

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function importPhotos(formData: FormData) {
  try {
    await requireAdmin();

    const files = formData.getAll("photos") as File[];
    if (files.length === 0 || (files.length === 1 && files[0].size === 0)) {
      return { success: false as const, error: "No files selected." };
    }

    let matched = 0;
    const unmatched: string[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (file.size === 0) continue;
      if (file.size > MAX_FILE_BYTES) {
        errors.push(`${file.name}: file too large (max 5MB)`);
        continue;
      }
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        errors.push(`${file.name}: unsupported type (use jpg, png, or webp)`);
        continue;
      }

      // Filename convention: dmartin@sei.com.jpg → email = dmartin@sei.com
      const email = file.name.replace(/\.[^.]+$/, "").toLowerCase().trim();
      if (!email.includes("@")) {
        errors.push(`${file.name}: filename must be the consultant's email address`);
        continue;
      }

      const { url } = await put(`photos/${email}`, file, {
        access: "public",
        addRandomSuffix: false,
        contentType: file.type,
      });

      const result = await sql`
        UPDATE consultants SET photo_url = ${url} WHERE email = ${email}
      `;

      if (result.rowCount === 0) {
        unmatched.push(file.name);
      } else {
        matched++;
      }
    }

    return { success: true as const, matched, unmatched, errors };
  } catch (error) {
    console.error("importPhotos error:", error);
    return { success: false as const, error: "Photo import failed. Please try again." };
  }
}
