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
  isScheduleDateEditable,
  scheduleRowsEqual,
  SCHEDULE_ADJUSTMENT_LEAD_DAYS,
  type DateScheduleRow,
} from "@/lib/schedule";
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

  const settings = rowToConfig(settingsRow);
  const blockedSet = new Set(blockedDates.map((b) => b.date));
  // Legacy BlockedDate rows appear as Off in the unified schedule editor
  settings.dateSchedule = settings.dateSchedule.map((row) =>
    blockedSet.has(row.date) ? { ...row, enabled: false } : row,
  );

  return NextResponse.json({
    appointments,
    messages,
    settings,
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
  timeSlots: z.array(z.string().regex(/^\d{2}:\d{2}$/)).max(48),
  weeklySchedule: z
    .array(
      z.object({
        dayKey: z.enum([
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ]),
        label: z.string().trim().min(1).max(20),
        enabled: z.boolean(),
        slots: z.array(z.string().regex(/^\d{2}:\d{2}$/)).max(48),
      }),
    )
    .optional(),
  dateSchedule: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      label: z.string().trim().min(1).max(40),
      enabled: z.boolean(),
      slots: z.array(z.string().regex(/^\d{2}:\d{2}$/)).max(48),
    }),
  ),
  bookingEnabled: z.boolean(),
  minLeadDays: z.number().int().min(7).max(30),
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
    const existingRow = await ensureClinicSettings();
    const existingConfig = rowToConfig(existingRow);
    const existingSaved = JSON.parse(
      existingRow.dateScheduleJson || "[]",
    ) as DateScheduleRow[];
    const existingMap = new Map(existingSaved.map((row) => [row.date, row]));

    for (const row of s.dateSchedule) {
      if (isScheduleDateEditable(row.date)) continue;
      const baseline =
        existingMap.get(row.date) ??
        existingConfig.dateSchedule.find((r) => r.date === row.date);
      if (!baseline) continue;
      const normalized: DateScheduleRow = {
        date: row.date,
        label: row.label,
        enabled: baseline.enabled,
        slots: baseline.slots ?? [],
      };
      if (!scheduleRowsEqual(row, normalized)) {
        return NextResponse.json(
          {
            error: `Schedule changes must be made at least ${SCHEDULE_ADJUSTMENT_LEAD_DAYS} days before the visit date.`,
          },
          { status: 400 },
        );
      }
    }

    const dateSchedule = s.dateSchedule.map((row) => {
      if (isScheduleDateEditable(row.date)) return row;
      const baseline =
        existingMap.get(row.date) ??
        existingConfig.dateSchedule.find((r) => r.date === row.date);
      if (!baseline) return row;
      return {
        date: row.date,
        label: row.label,
        enabled: baseline.enabled,
        slots: baseline.slots ?? [],
      };
    });

    const minLeadDays = Math.max(SCHEDULE_ADJUSTMENT_LEAD_DAYS, s.minLeadDays);
    const uniqueSlots = Array.from(
      new Set(dateSchedule.flatMap((row) => (row.enabled ? row.slots : []))),
    ).sort();

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
        timeSlotsJson: JSON.stringify(
          uniqueSlots.length ? uniqueSlots : s.timeSlots,
        ),
        weeklyScheduleJson: JSON.stringify(s.weeklySchedule ?? []),
        dateScheduleJson: JSON.stringify(dateSchedule),
        bookingEnabled: s.bookingEnabled,
        minLeadDays,
        maxAdvanceDays: s.maxAdvanceDays,
        autoConfirm: s.autoConfirm,
        confirmationNote: s.confirmationNote,
        notifyEmail: s.notifyEmail,
        notifyOnBooking: s.notifyOnBooking,
        notifyOnContact: s.notifyOnContact,
        emergencyNote: s.emergencyNote,
      },
    });

    // Keep BlockedDate table in sync with Off days in the schedule (one source of truth in UI)
    const offDates = dateSchedule
      .filter((row) => !row.enabled)
      .map((row) => row.date);
    const openDates = dateSchedule
      .filter((row) => row.enabled)
      .map((row) => row.date);

    if (openDates.length) {
      await prisma.blockedDate.deleteMany({
        where: { date: { in: openDates } },
      });
    }
    for (const date of offDates) {
      await prisma.blockedDate.upsert({
        where: { date },
        update: {},
        create: { date, reason: "Marked Off in schedule" },
      });
    }

    return NextResponse.json({ ok: true, settings: rowToConfig(row) });
  } catch {
    return NextResponse.json(
      { error: "Unable to save settings" },
      { status: 500 },
    );
  }
}
