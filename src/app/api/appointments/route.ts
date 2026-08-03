import { NextResponse } from "next/server";
import { addDays, format } from "date-fns";
import { appointmentSchema } from "@/lib/validators";
import { prisma } from "@/lib/prisma";
import {
  ensureAllSettings,
  getActiveServices,
  getBlockedDates,
  getClinicConfig,
  getSlotsForDate,
} from "@/lib/settings";
import {
  buildClinicConfirmEmail,
  buildVirtualConfirmEmail,
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
  getDemoMeetLink,
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

function meetCodeFromSeed(seed: string) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let n = 0;
  for (let i = 0; i < seed.length; i += 1) n = (n * 31 + seed.charCodeAt(i)) >>> 0;
  const part = (len: number) => {
    let out = "";
    let x = n;
    for (let i = 0; i < len; i += 1) {
      out += alphabet[x % 26];
      x = Math.floor(x / 26) || n + i + 1;
    }
    return out;
  };
  return `${part(3)}-${part(4)}-${part(3)}`;
}

export async function POST(request: Request) {
  try {
    if (!assertSameOrigin(request)) return forbiddenOrigin();

    const ip = getClientIp(request);
    const limited = rateLimit(`appointments:${ip}`, 10, 15 * 60 * 1000);
    if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

    await ensureAllSettings();
    const [config, services, blocked] = await Promise.all([
      getClinicConfig(),
      getActiveServices(),
      getBlockedDates(),
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

    if (blocked.some((b) => b.date === data.date)) {
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

    if (isVirtual && !data.payment) {
      return NextResponse.json(
        { error: "Consultation fee payment is required for virtual visits" },
        { status: 400 },
      );
    }

    const status = "confirmed";
    const seed = `${data.email}-${data.date}-${data.time}-${visitType}`;
    const meetCode = meetCodeFromSeed(seed);
    const meetLink = isVirtual ? getDemoMeetLink(meetCode) : null;
    const meetCodeShown = isVirtual
      ? meetLink!.replace("https://meet.google.com/", "").replace(/\/$/, "")
      : null;
    const time12 = to12h(data.time);
    const paymentRef = isVirtual
      ? `DEMO-${Date.now().toString(36).toUpperCase()}`
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
        meetLink,
        paymentStatus: isVirtual ? "paid" : "not_required",
        paymentAmount: fee,
        paymentRef,
        notes: data.notes || null,
        status,
      },
    });

    let emailSent = false;
    if (isVirtual && meetLink) {
      const mail = buildVirtualConfirmEmail({
        patientName: data.name,
        date: data.date,
        time12,
        meetLink,
        meetCode: meetCodeShown || meetCode,
        doctorName: config.doctor,
      });
      const result = await sendMail({
        to: data.email,
        subject: mail.subject,
        text: mail.text,
      });
      emailSent = result.sent;

      if (config.notifyOnBooking && config.notifyEmail) {
        await sendMail({
          to: config.notifyEmail,
          subject: `New virtual booking — ${data.date} ${time12}`,
          text: `${data.name} booked a virtual visit on ${data.date} at ${time12}.\nPaid: ${formatInr(fee)} (${paymentRef})\nMeet: ${meetLink}\nPhone: ${data.phone}\nEmail: ${data.email}`,
        });
      }
    } else {
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
        await sendMail({
          to: config.notifyEmail,
          subject: `New clinic booking — ${data.date} ${time12}`,
          text: `${data.name} booked a clinic visit on ${data.date} at ${time12}.\nPhone: ${data.phone}\nEmail: ${data.email}`,
        });
      }
    }

    const message = isVirtual
      ? `Payment of ${formatInr(fee)} received (demo). Confirmed for ${data.date} at ${time12}. Save your Google Meet details below${emailSent ? " — a copy was also emailed to you" : " (and screenshot this page)"}.`
      : `Confirmed for ${data.date} at ${time12} (clinic visit).${emailSent ? " Confirmation emailed to you." : ""} ${config.confirmationNote}`;

    return NextResponse.json({
      ok: true,
      message,
      status: appointment.status,
      meetLink: appointment.meetLink,
      meetCode: isVirtual ? meetCodeShown || meetCode : null,
      emailSent,
      appointmentId: appointment.id,
      timeLabel: time12,
      paymentStatus: isVirtual ? "paid" : "not_required",
      paymentAmount: fee,
      paymentRef,
      demo: isVirtual,
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
  const [booked, blocked, config] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        date,
        status: { in: ["pending", "confirmed"] },
      },
      select: { time: true, visitType: true },
    }),
    getBlockedDates(),
    getClinicConfig(),
  ]);

  const isBlocked = blocked.some((b) => b.date === date);
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
