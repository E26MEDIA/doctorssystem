import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureServices, invalidateSettingsCache } from "@/lib/settings";
import {
  assertSameOrigin,
  forbiddenOrigin,
  readJsonLimited,
} from "@/lib/security";

const serviceSchema = z.object({
  title: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, hyphens"),
  summary: z.string().trim().min(5).max(400),
  details: z.string().trim().min(5).max(1200),
  duration: z.string().trim().min(2).max(40),
  active: z.boolean(),
  sortOrder: z.number().int().min(0).max(999),
});

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const services = await ensureServices();
  return NextResponse.json({ services });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!assertSameOrigin(request)) return forbiddenOrigin();

  const body = await readJsonLimited(request);
  if (!body.ok) return body.response;

  const parsed = serviceSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid service" }, { status: 400 });
  }

  try {
    const service = await prisma.serviceOffering.create({ data: parsed.data });
    invalidateSettingsCache();
    return NextResponse.json({ ok: true, service });
  } catch {
    return NextResponse.json(
      { error: "Could not create service (slug may already exist)" },
      { status: 409 },
    );
  }
}
