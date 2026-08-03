import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { demoPaymentSchema } from "@/lib/validators";
import {
  assertSameOrigin,
  forbiddenOrigin,
  getClientIp,
  rateLimit,
  rateLimitResponse,
  readJsonLimited,
} from "@/lib/security";
import { formatInr, getDemoMeetLink, getVideoConsultFeeInr } from "@/lib/telehealth";

type Ctx = { params: Promise<{ token: string }> };

export async function POST(request: Request, context: Ctx) {
  if (!assertSameOrigin(request)) return forbiddenOrigin();

  const ip = getClientIp(request);
  const limited = rateLimit(`consult-pay:${ip}`, 10, 15 * 60 * 1000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const { token } = await context.params;
  const appointment = await prisma.appointment.findFirst({
    where: { joinToken: token, visitType: "online" },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Consultation not found" }, { status: 404 });
  }

  if (appointment.status === "cancelled") {
    return NextResponse.json(
      { error: "This consultation was cancelled" },
      { status: 400 },
    );
  }

  if (appointment.paymentStatus === "paid") {
    return NextResponse.json({
      ok: true,
      alreadyPaid: true,
      meetLink: appointment.meetLink || getDemoMeetLink(),
      message: "Already paid — you can join the video consult.",
    });
  }

  const body = await readJsonLimited(request);
  if (!body.ok) return body.response;

  const parsed = demoPaymentSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid card details" }, { status: 400 });
  }

  const fee = appointment.paymentAmount || getVideoConsultFeeInr();
  const paymentRef = `DEMO-${Date.now().toString(36).toUpperCase()}`;
  const meetLink = appointment.meetLink || getDemoMeetLink();

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: {
      paymentStatus: "paid",
      paymentAmount: fee,
      paymentRef,
      meetLink,
      status:
        appointment.status === "pending" ? "confirmed" : appointment.status,
    },
  });

  return NextResponse.json({
    ok: true,
    demo: true,
    paymentRef,
    paymentAmount: fee,
    paymentAmountLabel: formatInr(fee),
    meetLink,
    message: `Demo payment of ${formatInr(fee)} successful. You can join Google Meet below.`,
  });
}
