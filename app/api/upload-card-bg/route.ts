import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { detectImageType } from "@/lib/image-magic";

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "A valid image file is required." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds the 5 MB limit." }, { status: 400 });
  }

  const detected = await detectImageType(file);
  if (!detected) {
    return NextResponse.json({ error: "File is not a recognized image format (JPEG, PNG, WebP, or GIF)." }, { status: 400 });
  }

  const safeName = session.user.email.replace(/[^a-z0-9]/gi, "_");
  const pathname = `card-backgrounds/${safeName}_${Date.now()}.${detected.ext}`;

  const blob = await put(pathname, file, {
    access: "public",
    contentType: detected.mime,
  });

  await sql`
    UPDATE consultants
    SET card_bg_url = ${blob.url}
    WHERE email = ${session.user.email}
  `;

  return NextResponse.json({ url: blob.url });
}
