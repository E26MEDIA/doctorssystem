import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClinicConfig } from "@/lib/settings";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/security";
import { formatInr, getDemoMeetLink } from "@/lib/telehealth";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(request: Request, context: Ctx) {
  const ip = getClientIp(request);
  const limited = rateLimit(`consult-get:${ip}`, 60, 60 * 1000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const { token } = await context.params;
  if (!token || token.length < 8) {
    return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  }

  const appointment = await prisma.appointment.findFirst({
    where: { joinToken: token, visitType: "online" },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Consultation not found" }, { status: 404 });
  }

  const clinic = await getClinicConfig();
  const meetLink = appointment.meetLink || getDemoMeetLink();

  return NextResponse.json({
    clinic: {
      name: clinic.name,
      doctor: clinic.doctor,
      credentials: clinic.credentials,
    },
    appointment: {
      name: appointment.name,
      date: appointment.date,
      time: appointment.time,
      service: appointment.service,
      status: appointment.status,
      paymentStatus: appointment.paymentStatus,
      paymentAmount: appointment.paymentAmount,
      paymentAmountLabel: formatInr(appointment.paymentAmount),
      paymentRef: appointment.paymentRef,
    },
    meetLink,
    demo: true,
    canJoin:
      appointment.paymentStatus === "paid" &&
      appointment.status !== "cancelled",
  });
}
