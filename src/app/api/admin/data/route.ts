import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ensureAllSettings,
  ensureClinicSettings,
  getAllServices,
  getBlockedDates,
  rowToConfig,
} from "@/lib/settings";
import {
  assertSameOrigin,
  forbiddenOrigin,
  readJsonLimited,
} from "@/lib/security";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureAllSettings();

  const [appointments, messages, settingsRow, services, blockedDates] =
    await Promise.all([
      prisma.appointment.findMany({
        orderBy: [{ date: "asc" }, { time: "asc" }],
      }),
      prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } }),
      ensureClinicSettings(),
      getAllServices(),
      getBlockedDates(),
    ]);

  return NextResponse.json({
    appointments,
    messages,
    settings: rowToConfig(settingsRow),
    services,
    blockedDates,
  });
}

const optionalHttpUrl = z
  .string()
  .trim()
  .max(200)
  .refine(
    (v) => v === "" || /^https?:\/\/.+/i.test(v),
    "URL must start with http:// or https://",
  );

const settingsSchema = z.object({
  name: z.string().trim().min(2).max(120),
  doctor: z.string().trim().min(2).max(120),
  credentials: z.string().trim().min(2).max(160),
  tagline: z.string().trim().min(2).max(240),
  phone: z.string().trim().min(5).max(40),
  email: z.string().trim().email(),
  address: z.object({
    line1: z.string().trim().min(2).max(160),
    line2: z.string().trim().min(2).max(160),
  }),
  hours: z
    .array(
      z.object({
        day: z.string().trim().min(1).max(80),
        time: z.string().trim().min(1).max(80),
      }),
    )
    .min(1)
    .max(14),
  social: z.object({
    instagram: optionalHttpUrl,
    linkedin: optionalHttpUrl,
  }),
  timeSlots: z.array(z.string().regex(/^\d{2}:\d{2}$/)).min(1).max(48),
  bookingEnabled: z.boolean(),
  minLeadDays: z.number().int().min(0).max(30),
  maxAdvanceDays: z.number().int().min(1).max(365),
  autoConfirm: z.boolean(),
  confirmationNote: z.string().trim().min(2).max(400),
  notifyEmail: z
    .string()
    .trim()
    .max(120)
    .refine((v) => v === "" || z.string().email().safeParse(v).success, {
      message: "Invalid notify email",
    }),
  notifyOnBooking: z.boolean(),
  notifyOnContact: z.boolean(),
  emergencyNote: z.string().trim().min(2).max(400),
});

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!assertSameOrigin(request)) return forbiddenOrigin();

  try {
    const body = await readJsonLimited(request);
    if (!body.ok) return body.response;

    const parsed = settingsSchema.safeParse(body.data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid settings", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const s = parsed.data;
    await ensureClinicSettings();

    const row = await prisma.clinicSettings.update({
      where: { id: "default" },
      data: {
        clinicName: s.name,
        doctorName: s.doctor,
        credentials: s.credentials,
        tagline: s.tagline,
        phone: s.phone,
        email: s.email,
        addressLine1: s.address.line1,
        addressLine2: s.address.line2,
        instagram: s.social.instagram,
        linkedin: s.social.linkedin,
        hoursJson: JSON.stringify(s.hours),
        timeSlotsJson: JSON.stringify(s.timeSlots),
        bookingEnabled: s.bookingEnabled,
        minLeadDays: s.minLeadDays,
        maxAdvanceDays: s.maxAdvanceDays,
        autoConfirm: s.autoConfirm,
        confirmationNote: s.confirmationNote,
        notifyEmail: s.notifyEmail,
        notifyOnBooking: s.notifyOnBooking,
        notifyOnContact: s.notifyOnContact,
        emergencyNote: s.emergencyNote,
      },
    });

    return NextResponse.json({ ok: true, settings: rowToConfig(row) });
  } catch {
    return NextResponse.json(
      { error: "Unable to save settings" },
      { status: 500 },
    );
  }
}
