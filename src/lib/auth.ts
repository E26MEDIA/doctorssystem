import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ensureAdminAccount } from "@/lib/settings";
import { safeEqualString } from "@/lib/security";

const COOKIE_NAME = "meridian_admin";
const MAX_AGE_SEC = 60 * 60 * 8; // 8 hours

type SessionPayload = {
  sub: "admin";
  exp: number;
  iat: number;
  nonce: string;
};

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function getSecret() {
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret || secret.length < 32) {
    if (isProduction()) {
      throw new Error(
        "ADMIN_SECRET must be set to a random string of at least 32 characters",
      );
    }
    // Dev-only fallback — never used when NODE_ENV=production
    return "dev-only-insecure-admin-secret-do-not-use";
  }
  // Only block known placeholder secrets, not arbitrary strings that happen
  // to contain the letters "change" (that previously broke Render login).
  const blocked = new Set([
    "change-this-session-secret",
    "dev-secret",
    "replace-with-a-long-random-secret-at-least-32-chars",
  ]);
  if (isProduction() && blocked.has(secret)) {
    throw new Error("ADMIN_SECRET must be changed from the example value");
  }
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function createSessionToken() {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: "admin",
    iat: now,
    exp: now + MAX_AGE_SEC,
    nonce: randomBytes(16).toString("hex"),
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token: string | undefined) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [body, signature] = parts;
  if (!body || !signature) return false;

  const expected = sign(body);
  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as SessionPayload;

    if (payload.sub !== "admin") return false;
    if (typeof payload.exp !== "number" || typeof payload.iat !== "number") {
      return false;
    }
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now || payload.iat > now + 60) return false;
    return true;
  } catch {
    return false;
  }
}

export async function setAdminSession() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure: isProduction(),
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: isProduction(),
    path: "/",
    maxAge: 0,
  });
}

export async function isAdminAuthenticated() {
  const jar = await cookies();
  return verifySessionToken(jar.get(COOKIE_NAME)?.value);
}

function getEnvPassword(): string | null {
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!password) {
    if (isProduction()) return null;
    return "Demo@12345";
  }
  return password;
}

function envPasswordMatch(password: string) {
  const expected = getEnvPassword();
  if (!expected) return false;
  return safeEqualString(password, expected);
}

export async function checkAdminPassword(password: string) {
  if (!password || password.length > 72) return false;

  await ensureAdminAccount();
  const account = await prisma.adminAccount.findUnique({
    where: { id: "admin" },
  });

  if (account?.passwordHash) {
    return bcrypt.compare(password, account.passwordHash);
  }

  return envPasswordMatch(password);
}

export function validateNewPassword(password: string): string | null {
  if (password.length < 10) return "Password must be at least 10 characters";
  if (password.length > 72) return "Password must be at most 72 characters";
  if (!/[a-z]/.test(password)) return "Include a lowercase letter";
  if (!/[A-Z]/.test(password)) return "Include an uppercase letter";
  if (!/[0-9]/.test(password)) return "Include a number";
  if (!/[^A-Za-z0-9]/.test(password)) return "Include a special character";
  return null;
}

export async function setAdminPassword(newPassword: string) {
  const issue = validateNewPassword(newPassword);
  if (issue) throw new Error(issue);

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await ensureAdminAccount();
  await prisma.adminAccount.update({
    where: { id: "admin" },
    data: { passwordHash },
  });
}
