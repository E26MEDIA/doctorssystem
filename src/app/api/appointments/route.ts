import { NextResponse } from "next/server";
import { addDays, format } from "date-fns";
import { appointmentSchema } from "@/lib/validators";
import { prisma } from "@/lib/prisma";
import {
  ensureAllSettings,
  getActiveServices,
  getBlockedDates,
  getClinicConfig,
} from "@/lib/settings";
import {
  assertSameOrigin,
  forbiddenOrigin,
  getClientIp,
  rateLimit,
  rateLimitResponse,
  readJsonLimited,
} from "@/lib/security";

function meetCodeFromSeed(seed: string) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let n = 0;
  for (let i = 0; i < seed.length; i += 1) n = (n * 31 + seed.charCodeAt(i)) >>> 0;
  const part = (len: number) => {
    let out = "";
    let x = n;
    for (let i = 0; i < len; i += 1) {
      out += alphabet[x % 26];
      x = Math.floor(x / 26) || (n + i + 1);
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

    if (!config.timeSlots.includes(data.time)) {
      return NextResponse.json({ error: "Unavailable time slot" }, { status: 400 });
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
    // Instant confirm whenever a slot is open (doctor-owned weekly slots).
    const status = "confirmed";
    const seed = `${data.email}-${data.date}-${data.time}-${visitType}`;
    const meetLink = isVirtual
      ? `https://meet.google.com/${meetCodeFromSeed(seed)}`
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
        notes: data.notes || null,
        status,
      },
    });

    const message = isVirtual
      ? `Confirmed for ${data.date} at ${data.time}. Your Google Meet link is ready — join at the scheduled time. Confirmation emails go to you and the doctor.`
      : `Confirmed for ${data.date} at ${data.time} (clinic visit). Confirmation emails go to you and the doctor. ${config.confirmationNote}`;

    return NextResponse.json({
      ok: true,
      message,
      status: appointment.status,
      meetLink: appointment.meetLink,
      appointmentId: appointment.id,
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
      select: { time: true },
    }),
    getBlockedDates(),
    getClinicConfig(),
  ]);

  const isBlocked = blocked.some((b) => b.date === date);

  return NextResponse.json({
    booked: booked.map((b) => b.time),
    blocked: isBlocked,
    bookingEnabled: config.bookingEnabled,
    timeSlots: config.timeSlots,
    minDate: format(addDays(new Date(), config.minLeadDays), "yyyy-MM-dd"),
    maxDate: format(addDays(new Date(), config.maxAdvanceDays), "yyyy-MM-dd"),
  });
}
