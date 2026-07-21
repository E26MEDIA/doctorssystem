import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidateSettingsCache } from "@/lib/settings";
import {
  assertSameOrigin,
  forbiddenOrigin,
  readJsonLimited,
} from "@/lib/security";

type Params = { params: Promise<{ id: string }> };

const serviceSchema = z.object({
  title: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  summary: z.string().trim().min(5).max(400),
  details: z.string().trim().min(5).max(1200),
  duration: z.string().trim().min(2).max(40),
  active: z.boolean(),
  sortOrder: z.number().int().min(0).max(999),
});

export async function PUT(request: Request, { params }: Params) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!assertSameOrigin(request)) return forbiddenOrigin();

  const { id } = await params;
  if (!id || id.length > 64) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await readJsonLimited(request);
  if (!body.ok) return body.response;

  const parsed = serviceSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid service" }, { status: 400 });
  }

  try {
    const service = await prisma.serviceOffering.update({
      where: { id },
      data: parsed.data,
    });
    invalidateSettingsCache();
    return NextResponse.json({ ok: true, service });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 404 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!assertSameOrigin(request)) return forbiddenOrigin();

  const { id } = await params;
  if (!id || id.length > 64) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await prisma.serviceOffering.delete({ where: { id } });
    invalidateSettingsCache();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 404 });
  }
}
