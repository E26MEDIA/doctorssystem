import { NextResponse } from "next/server";
import { checkAdminPassword, setAdminSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import {
  artificialDelay,
  assertSameOrigin,
  forbiddenOrigin,
  getClientIp,
  rateLimit,
  rateLimitResponse,
  readJsonLimited,
} from "@/lib/security";

export async function POST(request: Request) {
  try {
    if (!assertSameOrigin(request)) return forbiddenOrigin();

    const ip = getClientIp(request);
    const limited = rateLimit(`admin-login:${ip}`, 5, 15 * 60 * 1000);
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

    const body = await readJsonLimited(request);
    if (!body.ok) return body.response;

    const parsed = loginSchema.safeParse(body.data);
    if (!parsed.success) {
      await artificialDelay();
      return NextResponse.json({ error: "Password required" }, { status: 400 });
    }

    const valid = await checkAdminPassword(parsed.data.password);
    if (!valid) {
      await artificialDelay();
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    await setAdminSession();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
