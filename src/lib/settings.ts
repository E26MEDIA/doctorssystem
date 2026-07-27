import { addDays, format } from "date-fns";
import { prisma } from "@/lib/prisma";
import {
  articles,
  clinic as defaultClinic,
  services as defaultServices,
  testimonials,
  timeSlots as defaultTimeSlots,
} from "@/lib/clinic";

export type HourRow = { day: string; time: string };
export type WeeklyScheduleRow = {
  dayKey: string;
  label: string;
  enabled: boolean;
  slots: string[];
};
export type DateScheduleRow = {
  date: string;
  label: string;
  enabled: boolean;
  slots: string[];
};

export type ClinicConfig = {
  name: string;
  doctor: string;
  credentials: string;
  tagline: string;
  phone: string;
  email: string;
  address: { line1: string; line2: string };
  hours: HourRow[];
  social: { instagram: string; linkedin: string };
  timeSlots: string[];
  weeklySchedule: WeeklyScheduleRow[];
  dateSchedule: DateScheduleRow[];
  bookingEnabled: boolean;
  minLeadDays: number;
  maxAdvanceDays: number;
  autoConfirm: boolean;
  confirmationNote: string;
  notifyEmail: string;
  notifyOnBooking: boolean;
  notifyOnContact: boolean;
  emergencyNote: string;
};

export type ServiceItem = {
  id?: string;
  slug: string;
  title: string;
  summary: string;
  details: string;
  duration: string;
  active: boolean;
  sortOrder: number;
};

const defaultHours: HourRow[] = defaultClinic.hours.map((h) => ({
  day: h.day,
  time: h.time,
}));

export const weekdayOptions = [
  { dayKey: "monday", label: "Monday" },
  { dayKey: "tuesday", label: "Tuesday" },
  { dayKey: "wednesday", label: "Wednesday" },
  { dayKey: "thursday", label: "Thursday" },
  { dayKey: "friday", label: "Friday" },
  { dayKey: "saturday", label: "Saturday" },
  { dayKey: "sunday", label: "Sunday" },
] as const;

const defaultWeeklySchedule: WeeklyScheduleRow[] = weekdayOptions.map(
  ({ dayKey, label }, index) => ({
    dayKey,
    label,
    enabled: index < 6,
    slots: [...defaultTimeSlots],
  }),
);

export function formatScheduleLabel(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return format(d, "EEE, d MMM yyyy");
}

/** Build the next N bookable calendar days for the admin schedule editor. */
export function buildDateScheduleWindow(
  days = 14,
  leadDays = 1,
  saved: DateScheduleRow[] = [],
): DateScheduleRow[] {
  const savedMap = new Map(saved.map((row) => [row.date, row]));
  const start = addDays(new Date(), leadDays);
  start.setHours(0, 0, 0, 0);

  return Array.from({ length: days }, (_, i) => {
    const date = format(addDays(start, i), "yyyy-MM-dd");
    const existing = savedMap.get(date);
    const weekday = addDays(start, i).getDay(); // 0 Sun
    return {
      date,
      label: formatScheduleLabel(date),
      enabled: existing?.enabled ?? weekday !== 0,
      slots:
        existing?.slots?.filter((slot) => /^\d{2}:\d{2}$/.test(slot)) ??
        [...defaultTimeSlots],
    };
  });
}

export function defaultsConfig(): ClinicConfig {
  return {
    name: defaultClinic.name,
    doctor: defaultClinic.doctor,
    credentials: defaultClinic.credentials,
    tagline: defaultClinic.tagline,
    phone: defaultClinic.phone,
    email: defaultClinic.email,
    address: {
      line1: defaultClinic.address.line1,
      line2: defaultClinic.address.line2,
    },
    hours: defaultHours,
    social: {
      instagram: defaultClinic.social.instagram,
      linkedin: defaultClinic.social.linkedin,
    },
    timeSlots: [...defaultTimeSlots],
    weeklySchedule: defaultWeeklySchedule.map((row) => ({
      ...row,
      slots: [...row.slots],
    })),
    dateSchedule: buildDateScheduleWindow(14, 1),
    bookingEnabled: true,
    minLeadDays: 1,
    maxAdvanceDays: 60,
    autoConfirm: true,
    confirmationNote:
      "Your appointment is confirmed. You and the doctor will receive email details for this slot.",
    notifyEmail: defaultClinic.email,
    notifyOnBooking: true,
    notifyOnContact: true,
    emergencyNote:
      "Not for emergencies — call local emergency services if needed.",
  };
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeWeeklySchedule(rows: WeeklyScheduleRow[] | null | undefined) {
  const map = new Map((rows ?? []).map((row) => [row.dayKey, row]));
  return weekdayOptions.map(({ dayKey, label }, index) => {
    const existing = map.get(dayKey);
    return {
      dayKey,
      label,
      enabled: existing?.enabled ?? index < 6,
      slots:
        existing?.slots?.filter((slot) => /^\d{2}:\d{2}$/.test(slot)) ??
        [...defaultTimeSlots],
    };
  });
}

export async function ensureClinicSettings() {
  const d = defaultsConfig();
  const payload = {
    clinicName: d.name,
    doctorName: d.doctor,
    credentials: d.credentials,
    tagline: d.tagline,
    phone: d.phone,
    email: d.email,
    addressLine1: d.address.line1,
    addressLine2: d.address.line2,
    instagram: d.social.instagram,
    linkedin: d.social.linkedin,
    hoursJson: JSON.stringify(d.hours),
    timeSlotsJson: JSON.stringify(d.timeSlots),
    weeklyScheduleJson: JSON.stringify(d.weeklySchedule),
    dateScheduleJson: JSON.stringify(d.dateSchedule),
    bookingEnabled: d.bookingEnabled,
    minLeadDays: d.minLeadDays,
    maxAdvanceDays: d.maxAdvanceDays,
    autoConfirm: d.autoConfirm,
    confirmationNote: d.confirmationNote,
    notifyEmail: d.notifyEmail,
    notifyOnBooking: d.notifyOnBooking,
    notifyOnContact: d.notifyOnContact,
    emergencyNote: d.emergencyNote,
  };

  // CRITICAL: never overwrite admin-saved settings on every page load
  return prisma.clinicSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", ...payload },
  });
}

export async function ensureServices() {
  for (const [i, s] of defaultServices.entries()) {
    await prisma.serviceOffering.upsert({
      where: { slug: s.slug },
      update: {},
      create: {
        slug: s.slug,
        title: s.title,
        summary: s.summary,
        details: s.details,
        duration: s.duration,
        active: true,
        sortOrder: i,
      },
    });
  }

  return prisma.serviceOffering.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function ensureAdminAccount() {
  return prisma.adminAccount.upsert({
    where: { id: "admin" },
    update: {},
    create: { id: "admin", passwordHash: null },
  });
}

export async function ensureAllSettings() {
  await Promise.all([
    ensureClinicSettings(),
    ensureServices(),
    ensureAdminAccount(),
  ]);
}

export function rowToConfig(
  row: Awaited<ReturnType<typeof ensureClinicSettings>>,
): ClinicConfig {
  const weeklySchedule = normalizeWeeklySchedule(
    parseJson<WeeklyScheduleRow[]>(row.weeklyScheduleJson, defaultWeeklySchedule),
  );
  const savedDates = parseJson<DateScheduleRow[]>(
    row.dateScheduleJson || "[]",
    [],
  );

  return {
    name: row.clinicName,
    doctor: row.doctorName,
    credentials: row.credentials,
    tagline: row.tagline,
    phone: row.phone,
    email: row.email,
    address: {
      line1: row.addressLine1,
      line2: row.addressLine2,
    },
    hours: parseJson<HourRow[]>(row.hoursJson, defaultHours),
    social: {
      instagram: row.instagram,
      linkedin: row.linkedin,
    },
    timeSlots: parseJson<string[]>(row.timeSlotsJson, [...defaultTimeSlots]),
    weeklySchedule,
    dateSchedule: buildDateScheduleWindow(
      14,
      row.minLeadDays,
      savedDates,
    ),
    bookingEnabled: row.bookingEnabled,
    minLeadDays: row.minLeadDays,
    maxAdvanceDays: row.maxAdvanceDays,
    autoConfirm: row.autoConfirm,
    confirmationNote: row.confirmationNote,
    notifyEmail: row.notifyEmail,
    notifyOnBooking: row.notifyOnBooking,
    notifyOnContact: row.notifyOnContact,
    emergencyNote: row.emergencyNote,
  };
}

export function getSlotsForDate(config: ClinicConfig, date: string): string[] {
  const exact = config.dateSchedule.find((row) => row.date === date);
  if (exact) {
    if (!exact.enabled) return [];
    return exact.slots;
  }

  // Fallback for dates outside the 14-day admin window: weekly template
  const target = new Date(`${date}T00:00:00`);
  if (Number.isNaN(target.getTime())) return [];
  const dayKey = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ][target.getDay()];
  const weekly = config.weeklySchedule.find((item) => item.dayKey === dayKey);
  if (!weekly || !weekly.enabled) return [];
  return weekly.slots;
}

export async function getClinicConfig(): Promise<ClinicConfig> {
  const row = await ensureClinicSettings();
  return rowToConfig(row);
}

export async function getActiveServices(): Promise<ServiceItem[]> {
  const rows = await ensureServices();
  return rows
    .filter((s) => s.active)
    .map((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      summary: s.summary,
      details: s.details,
      duration: s.duration,
      active: s.active,
      sortOrder: s.sortOrder,
    }));
}

export async function getAllServices(): Promise<ServiceItem[]> {
  const rows = await ensureServices();
  return rows.map((s) => ({
    id: s.id,
    slug: s.slug,
    title: s.title,
    summary: s.summary,
    details: s.details,
    duration: s.duration,
    active: s.active,
    sortOrder: s.sortOrder,
  }));
}

export async function getBlockedDates() {
  return prisma.blockedDate.findMany({ orderBy: { date: "asc" } });
}

export { testimonials, articles };
