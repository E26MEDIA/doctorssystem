import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

/** Simple in-memory sliding window. Fine for single-instance deploys. */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const bucket = rateBuckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

export function rateLimitResponse(retryAfterSec: number) {
  return NextResponse.json(
    { error: "Too many requests. Please try again shortly." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    },
  );
}

export function assertSameOrigin(request: Request): boolean {
  if (request.method === "GET" || request.method === "HEAD") return true;

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!host) return false;

  // Same-origin browser fetches always send Origin on POST.
  // Non-browser clients (curl) may omit it — allow only in development.
  if (!origin) {
    return process.env.NODE_ENV !== "production";
  }

  try {
    const url = new URL(origin);
    return url.host === host;
  } catch {
    return false;
  }
}

export function forbiddenOrigin() {
  return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
}

const MAX_JSON_BYTES = 32_768;

export async function readJsonLimited<T = unknown>(
  request: Request,
  maxBytes = MAX_JSON_BYTES,
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > maxBytes) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Payload too large" }, { status: 413 }),
    };
  }

  const text = await request.text();
  if (text.length > maxBytes) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Payload too large" }, { status: 413 }),
    };
  }

  try {
    return { ok: true, data: JSON.parse(text) as T };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }),
    };
  }
}

export function safeEqualString(a: string, b: string): boolean {
  const ah = createHash("sha256").update(a).digest();
  const bh = createHash("sha256").update(b).digest();
  return timingSafeEqual(ah, bh);
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

export async function artificialDelay(ms = 250) {
  await new Promise((r) => setTimeout(r, ms));
}
