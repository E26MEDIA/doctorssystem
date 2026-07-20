import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validators";
import { prisma } from "@/lib/prisma";
import {
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
    const limited = rateLimit(`contact:${ip}`, 8, 15 * 60 * 1000);
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

    const body = await readJsonLimited(request);
    if (!body.ok) return body.response;

    const parsed = contactSchema.safeParse(body.data);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid message" },
        { status: 400 },
      );
    }

    const data = parsed.data;
    await prisma.contactMessage.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        subject: data.subject || null,
        message: data.message,
      },
    });

    // Do not leak internal message IDs to anonymous clients
    return NextResponse.json({
      ok: true,
      message: "Thanks — we'll reply within one business day.",
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to send message right now" },
      { status: 500 },
    );
  }
}
