"use server";

import * as XLSX from "xlsx";
import { put } from "@vercel/blob";
import { pool, sql } from "@/lib/db";
import { auth } from "../../auth";
import type { Consultant } from "@/lib/types";
import { SURVEY_FIELD_MAP, SKIP_KEYS, SYSTEM_COLUMNS } from "@/lib/survey-fields";

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

export async function importSurveyData(formData: FormData) {
  try {
    await requireAdmin();

    const file = formData.get("file") as File;
    if (!file || file.size === 0) return { success: false as const, error: "No file selected." };
    if (file.size > MAX_FILE_BYTES) return { success: false as const, error: "File is too large. Max size is 5MB." };

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });

    if (rawRows.length === 0) return { success: false as const, error: "File appears empty." };

    let matched = 0;
    let unmatched = 0;
    const unrecognizedColumns = new Set<string>();

    for (const rawRow of rawRows) {
      // Normalize column headers: lowercase + trim
      const row: Record<string, string> = {};
      for (const [k, v] of Object.entries(rawRow)) {
        row[k.toLowerCase().trim()] = String(v ?? "").trim();
      }

      // Find SEI email — try the explicit Q2 column first, then Forms' system "email" column
      const emailColKey = Object.keys(row).find(k => SURVEY_FIELD_MAP[k] === "email");
      const email = (emailColKey ? row[emailColKey] : row["email"] ?? "").toLowerCase().trim();

      if (!email || !EMAIL_RE.test(email)) { unmatched++; continue; }

      // Build the JSONB payload, skipping system columns and join-key fields
      const surveyData: Record<string, string> = {};
      for (const [col, value] of Object.entries(row)) {
        if (SYSTEM_COLUMNS.has(col)) continue;
        const key = SURVEY_FIELD_MAP[col];
        if (!key) { unrecognizedColumns.add(col); continue; }
        if (SKIP_KEYS.has(key)) continue;
        if (value) surveyData[key] = value;
      }

      // Merge into existing survey_data rather than replacing it wholesale
      const result = await pool.query(
        `UPDATE consultants
         SET survey_data = COALESCE(survey_data, '{}'::jsonb) || $1::jsonb
         WHERE LOWER(email) = $2`,
        [JSON.stringify(surveyData), email]
      );

      if ((result.rowCount ?? 0) === 0) unmatched++;
      else matched++;
    }

    return {
      success: true as const,
      matched,
      unmatched,
      unrecognizedColumns: [...unrecognizedColumns],
    };
  } catch (error) {
    console.error("importSurveyData error:", error);
    return { success: false as const, error: "Survey import failed. Check the file format and try again." };
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

      // Filename conventions:
      //   dmartin@sei.com.jpg       → base photo (photo_url)
      //   dmartin@sei.com_l1.jpg    → Introduced portrait (photo_url_l1)
      //   dmartin@sei.com_l2.jpg    → Hung Out portrait   (photo_url_l2)
      //   dmartin@sei.com_l3.jpg    → Worked Together portrait (photo_url_l3)
      const nameWithoutExt = file.name.replace(/\.[^.]+$/, "").toLowerCase().trim();
      const levelMatch = nameWithoutExt.match(/^(.+)_(l[123])$/);
      const email = levelMatch ? levelMatch[1] : nameWithoutExt;
      const levelSuffix = levelMatch ? levelMatch[2] : null; // "l1" | "l2" | "l3" | null

      if (!email.includes("@")) {
        errors.push(`${file.name}: filename must start with the consultant's email address`);
        continue;
      }

      const blobKey = levelSuffix ? `photos/${email}_${levelSuffix}` : `photos/${email}`;

      const { url } = await put(blobKey, file, {
        access: "public",
        addRandomSuffix: false,
        contentType: file.type,
      });

      const result = levelSuffix === "l1"
        ? await sql`UPDATE consultants SET photo_url_l1 = ${url} WHERE email = ${email}`
        : levelSuffix === "l2"
        ? await sql`UPDATE consultants SET photo_url_l2 = ${url} WHERE email = ${email}`
        : levelSuffix === "l3"
        ? await sql`UPDATE consultants SET photo_url_l3 = ${url} WHERE email = ${email}`
        : await sql`UPDATE consultants SET photo_url = ${url} WHERE email = ${email}`;

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
