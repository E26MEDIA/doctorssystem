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
    autoConfirm: false,
    confirmationNote:
      "We will confirm your appointment within one business day.",
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
  return prisma.clinicSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
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
    },
  });
}

export async function ensureServices() {
  const existing = await prisma.serviceOffering.findMany({
    orderBy: { sortOrder: "asc" },
  });
  if (existing.length > 0) return existing;

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

/** Short in-process cache so layout + pages don't upsert SQLite on every hit. */
const CACHE_TTL_MS = process.env.NODE_ENV === "production" ? 30_000 : 5_000;

type CacheEntry<T> = { value: T; expires: number };

let clinicCache: CacheEntry<ClinicConfig> | null = null;
let servicesCache: CacheEntry<ServiceItem[]> | null = null;

export function invalidateSettingsCache() {
  clinicCache = null;
  servicesCache = null;
}

export async function getClinicConfig(): Promise<ClinicConfig> {
  const now = Date.now();
  if (clinicCache && clinicCache.expires > now) {
    return clinicCache.value;
  }
  const row = await ensureClinicSettings();
  const value = rowToConfig(row);
  clinicCache = { value, expires: now + CACHE_TTL_MS };
  return value;
}

function mapService(s: {
  id: string;
  slug: string;
  title: string;
  summary: string;
  details: string;
  duration: string;
  active: boolean;
  sortOrder: number;
}): ServiceItem {
  return {
    id: s.id,
    slug: s.slug,
    title: s.title,
    summary: s.summary,
    details: s.details,
    duration: s.duration,
    active: s.active,
    sortOrder: s.sortOrder,
  };
}

async function loadAllServices(): Promise<ServiceItem[]> {
  const now = Date.now();
  if (servicesCache && servicesCache.expires > now) {
    return servicesCache.value;
  }
  const rows = await ensureServices();
  const value = rows.map(mapService);
  servicesCache = { value, expires: now + CACHE_TTL_MS };
  return value;
}

export async function getActiveServices(): Promise<ServiceItem[]> {
  const rows = await loadAllServices();
  return rows.filter((s) => s.active);
}

export async function getAllServices(): Promise<ServiceItem[]> {
  return loadAllServices();
}

export async function getBlockedDates() {
  return prisma.blockedDate.findMany({ orderBy: { date: "asc" } });
}

export { testimonials, articles };
