import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin, forbiddenOrigin } from "@/lib/security";

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

  try {
    const message = await prisma.contactMessage.update({
      where: { id },
      data: { read: true },
    });
    return NextResponse.json({ ok: true, message });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
