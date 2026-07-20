import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { statusSchema } from "@/lib/validators";
import {
  assertSameOrigin,
  forbiddenOrigin,
  readJsonLimited,
} from "@/lib/security";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
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

  const parsed = statusSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status: parsed.data.status },
    });
    return NextResponse.json({ ok: true, appointment });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
