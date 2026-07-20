import { NextResponse } from "next/server";
import { z } from "zod";
import {
  checkAdminPassword,
  isAdminAuthenticated,
  setAdminPassword,
  setAdminSession,
  validateNewPassword,
} from "@/lib/auth";
import {
  artificialDelay,
  assertSameOrigin,
  forbiddenOrigin,
  getClientIp,
  rateLimit,
  rateLimitResponse,
  readJsonLimited,
} from "@/lib/security";

const schema = z.object({
  currentPassword: z.string().min(1).max(72),
  newPassword: z.string().min(10).max(72),
});

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!assertSameOrigin(request)) return forbiddenOrigin();

  const ip = getClientIp(request);
  const limited = rateLimit(`admin-password:${ip}`, 5, 15 * 60 * 1000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const body = await readJsonLimited(request);
  if (!body.ok) return body.response;

  const parsed = schema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const policyError = validateNewPassword(parsed.data.newPassword);
  if (policyError) {
    return NextResponse.json({ error: policyError }, { status: 400 });
  }

  const ok = await checkAdminPassword(parsed.data.currentPassword);
  if (!ok) {
    await artificialDelay();
    return NextResponse.json(
      { error: "Current password is incorrect" },
      { status: 401 },
    );
  }

  try {
    await setAdminPassword(parsed.data.newPassword);
    // Rotate session after password change
    await setAdminSession();
    return NextResponse.json({
      ok: true,
      message: "Password updated. Use the new password next time you sign in.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 },
    );
  }
}
