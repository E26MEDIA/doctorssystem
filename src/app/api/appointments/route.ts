import { NextResponse } from "next/server";
import { addDays, format } from "date-fns";
import { appointmentSchema } from "@/lib/validators";
import { prisma } from "@/lib/prisma";
import {
  ensureAllSettings,
  getActiveServices,
  getClinicConfig,
  getSlotsForDate,
  isClinicClosedOn,
} from "@/lib/settings";
import {
  buildClinicConfirmEmail,
  sendMail,
} from "@/lib/email";
import {
  assertSameOrigin,
  forbiddenOrigin,
  getClientIp,
  rateLimit,
  rateLimitResponse,
  readJsonLimited,
} from "@/lib/security";
import {
  formatInr,
  getVideoConsultFeeInr,
} from "@/lib/telehealth";

function to12h(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export async function POST(request: Request) {
  try {
    if (!assertSameOrigin(request)) return forbiddenOrigin();

    const ip = getClientIp(request);
    const limited = rateLimit(`appointments:${ip}`, 10, 15 * 60 * 1000);
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

    await ensureAllSettings();
    const [config, services] = await Promise.all([
      getClinicConfig(),
      getActiveServices(),
    ]);

    if (!config.bookingEnabled) {
      return NextResponse.json(
        { error: "Online booking is temporarily closed" },
        { status: 403 },
      );
    }

    const body = await readJsonLimited(request);
    if (!body.ok) return body.response;

    const parsed = appointmentSchema.safeParse(body.data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid appointment details" },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const matched =
      services.find((s) => s.title === data.service) ||
      services.find((s) => s.slug === data.visitType);

    if (!matched) {
      return NextResponse.json({ error: "Unknown service" }, { status: 400 });
    }

    const daySlots = getSlotsForDate(config, data.date);
    if (!daySlots.includes(data.time)) {
      return NextResponse.json(
        { error: "Unavailable time slot for this date" },
        { status: 400 },
      );
    }

    if (isClinicClosedOn(config, data.date)) {
      return NextResponse.json(
        { error: "The clinic is closed on that date" },
        { status: 400 },
      );
    }

    const appointmentDate = new Date(`${data.date}T00:00:00`);
    const minDate = new Date();
    minDate.setHours(0, 0, 0, 0);
    minDate.setDate(minDate.getDate() + config.minLeadDays);
    const maxDate = new Date();
    maxDate.setHours(0, 0, 0, 0);
    maxDate.setDate(maxDate.getDate() + config.maxAdvanceDays);

    if (
      Number.isNaN(appointmentDate.getTime()) ||
      appointmentDate < minDate ||
      appointmentDate > maxDate
    ) {
      return NextResponse.json(
        {
          error: `Please choose a date between ${format(minDate, "yyyy-MM-dd")} and ${format(maxDate, "yyyy-MM-dd")}`,
        },
        { status: 400 },
      );
    }

    // Lock applies to BOTH clinic and virtual — one booking owns the slot
    const conflict = await prisma.appointment.findFirst({
      where: {
        date: data.date,
        time: data.time,
        status: { in: ["pending", "confirmed"] },
      },
    });

    if (conflict) {
      return NextResponse.json(
        { error: "That slot was just taken. Please pick another time." },
        { status: 409 },
      );
    }

    const visitType = data.visitType || matched.slug;
    const isVirtual = visitType === "virtual-consultation";
    const fee = isVirtual ? getVideoConsultFeeInr() : 0;
    const time12 = to12h(data.time);
    const payToken = isVirtual
      ? crypto.randomUUID().replace(/-/g, "")
      : null;

    const appointment = await prisma.appointment.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        date: data.date,
        time: data.time,
        service: matched.title,
        visitType,
        meetLink: null,
        paymentStatus: isVirtual ? "unpaid" : "not_required",
        paymentAmount: fee,
        paymentRef: null,
        paymentMethod: null,
        payToken,
        notes: data.notes || null,
        status: isVirtual ? "pending" : "confirmed",
      },
    });

    let emailSent = false;
    if (!isVirtual) {
      const mail = buildClinicConfirmEmail({
        patientName: data.name,
        date: data.date,
        time12,
        doctorName: config.doctor,
        note: config.confirmationNote,
      });
      const result = await sendMail({
        to: data.email,
        subject: mail.subject,
        text: mail.text,
      });
      emailSent = result.sent;

      if (config.notifyOnBooking && config.notifyEmail) {
        const whenLabel = format(
          new Date(`${data.date}T00:00:00`),
          "EEEE, d MMMM yyyy",
        );
        await sendMail({
          to: config.notifyEmail,
          subject: `New clinic booking — ${whenLabel} at ${time12}`,
          text: `${data.name} booked a clinic visit.\nDate: ${whenLabel}\nTime: ${time12}\nPhone: ${data.phone}\nEmail: ${data.email}`,
        });
      }
    }

    if (isVirtual) {
      return NextResponse.json({
        ok: true,
        message: `Slot reserved for ${data.date} at ${time12}. Complete payment to confirm and receive your Google Meet link.`,
        status: appointment.status,
        paymentRequired: true,
        paymentAmount: fee,
        paymentAmountLabel: formatInr(fee),
        payUrl: `/pay/${payToken}`,
        appointmentId: appointment.id,
        timeLabel: time12,
      });
    }

    return NextResponse.json({
      ok: true,
      message: `Confirmed for ${data.date} at ${time12} (clinic visit).${emailSent ? " Confirmation emailed to you." : ""} ${config.confirmationNote}`,
      status: appointment.status,
      meetLink: null,
      meetCode: null,
      emailSent,
      appointmentId: appointment.id,
      timeLabel: time12,
      paymentRequired: false,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to book appointment right now" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const limited = rateLimit(`appointments-get:${ip}`, 60, 60 * 1000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Valid date required" }, { status: 400 });
  }

  await ensureAllSettings();
  const [booked, config] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        date,
        status: { in: ["pending", "confirmed"] },
      },
      select: { time: true, visitType: true },
    }),
    getClinicConfig(),
  ]);

  const isBlocked = isClinicClosedOn(config, date);
  const daySlots = getSlotsForDate(config, date);

  return NextResponse.json({
    booked: booked.map((b) => b.time),
    blocked: isBlocked,
    bookingEnabled: config.bookingEnabled,
    timeSlots: daySlots,
    minDate: format(addDays(new Date(), config.minLeadDays), "yyyy-MM-dd"),
    maxDate: format(addDays(new Date(), config.maxAdvanceDays), "yyyy-MM-dd"),
    videoConsultFee: getVideoConsultFeeInr(),
  });
}
