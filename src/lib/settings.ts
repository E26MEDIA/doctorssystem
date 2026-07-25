import { prisma } from "@/lib/prisma";
import {
  articles,
  clinic as defaultClinic,
  services as defaultServices,
  testimonials,
  timeSlots as defaultTimeSlots,
} from "@/lib/clinic";

export type HourRow = { day: string; time: string };

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
  return prisma.clinicSettings.upsert({
    where: { id: "default" },
    update: payload,
    create: { id: "default", ...payload },
  });
}

export async function ensureServices() {
  const defaultSlugs = new Set<string>(defaultServices.map((s) => s.slug));

  for (const [i, s] of defaultServices.entries()) {
    await prisma.serviceOffering.upsert({
      where: { slug: s.slug },
      update: {
        title: s.title,
        summary: s.summary,
        details: s.details,
        duration: s.duration,
        active: true,
        sortOrder: i,
      },
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

  const existing = await prisma.serviceOffering.findMany({
    orderBy: { sortOrder: "asc" },
  });

  const stale = existing.filter((row) => !defaultSlugs.has(row.slug));
  if (stale.length) {
    await prisma.serviceOffering.updateMany({
      where: { slug: { in: stale.map((s) => s.slug) } },
      data: { active: false },
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
