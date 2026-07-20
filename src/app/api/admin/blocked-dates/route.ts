import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  assertSameOrigin,
  forbiddenOrigin,
  readJsonLimited,
} from "@/lib/security";

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().trim().max(200).optional().or(z.literal("")),
});

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const blockedDates = await prisma.blockedDate.findMany({
    orderBy: { date: "asc" },
  });
  return NextResponse.json({ blockedDates });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!assertSameOrigin(request)) return forbiddenOrigin();

  const body = await readJsonLimited(request);
  if (!body.ok) return body.response;

  const parsed = schema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  try {
    const blocked = await prisma.blockedDate.create({
      data: {
        date: parsed.data.date,
        reason: parsed.data.reason || null,
      },
    });
    return NextResponse.json({ ok: true, blocked });
  } catch {
    return NextResponse.json(
      { error: "That date is already blocked" },
      { status: 409 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!assertSameOrigin(request)) return forbiddenOrigin();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id || id.length > 64) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  await prisma.blockedDate.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
