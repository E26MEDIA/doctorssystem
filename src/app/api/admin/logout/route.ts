import { NextResponse } from "next/server";
import { clearAdminSession, isAdminAuthenticated } from "@/lib/auth";
import { assertSameOrigin, forbiddenOrigin } from "@/lib/security";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return forbiddenOrigin();
  if (await isAdminAuthenticated()) {
    await clearAdminSession();
  }
  return NextResponse.json({ ok: true });
}
