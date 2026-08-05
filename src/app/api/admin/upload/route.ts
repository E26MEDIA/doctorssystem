import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { isAdminAuthenticated } from "@/lib/auth";
import { assertSameOrigin, forbiddenOrigin } from "@/lib/security";

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function extFor(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return "jpg";
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(
      { error: "Session expired — please sign in again." },
      { status: 401 },
    );
  }
  if (!assertSameOrigin(request)) return forbiddenOrigin();

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Image file required" }, { status: 400 });
    }
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json(
        { error: "Use JPG, PNG, WebP, or GIF" },
        { status: 400 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image must be under 4 MB" },
        { status: 400 },
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const name = `${Date.now()}-${randomBytes(4).toString("hex")}.${extFor(file.type)}`;
    const dir = path.join(process.cwd(), "public", "uploads", "journal");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), bytes);

    const url = `/uploads/journal/${name}`;
    return NextResponse.json({ ok: true, url });
  } catch (error) {
    console.error("[upload]", error);
    return NextResponse.json(
      { error: "Could not upload image" },
      { status: 500 },
    );
  }
}
