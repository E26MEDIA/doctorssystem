import { prisma } from "@/lib/prisma";
import {
  articles,
  clinic as defaultClinic,
  services as defaultServices,
  testimonials,
  timeSlots as defaultTimeSlots,
} from "@/lib/clinic";
import {
  buildDateScheduleWindow,
  formatScheduleLabel,
  getScheduleEditCutoffDate,
  getSlotsForDateRow,
  getSlotsForSavedDate,
  isDateClosedInSchedule,
  isDateClosedInSaved,
  isScheduleDateEditable,
  scheduleRowsEqual,
  SCHEDULE_ADJUSTMENT_LEAD_DAYS,
  type DateScheduleRow,
} from "@/lib/schedule";
import {
  isLegacyStringBody,
  parseJournalBlocks,
  type JournalBlock,
} from "@/lib/journal";

export type HourRow = { day: string; time: string };
export type WeeklyScheduleRow = {
  dayKey: string;
  label: string;
  enabled: boolean;
  slots: string[];
};
export type { DateScheduleRow };
export {
  buildDateScheduleWindow,
  formatScheduleLabel,
  isDateClosedInSchedule,
  isDateClosedInSaved,
  isScheduleDateEditable,
  SCHEDULE_ADJUSTMENT_LEAD_DAYS,
  getScheduleEditCutoffDate,
  scheduleRowsEqual,
  getSlotsForSavedDate,
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
  /** Raw schedule rows persisted in the database. */
  savedDateSchedule: DateScheduleRow[];
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
    dateSchedule: buildDateScheduleWindow(60, 7, [], { fillDefaults: true }),
    savedDateSchedule: buildDateScheduleWindow(60, 7, [], { fillDefaults: true }),
    bookingEnabled: true,
    minLeadDays: 7,
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
  const row = await prisma.clinicSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", ...payload },
  });

  const previousCredentials =
    "MBBS, MS (General Surgery), Fellowship in Surgical Gastroenterology";
  const patch: { doctorName?: string; credentials?: string } = {};
  if (/Sharath/i.test(row.doctorName) && d.doctor !== row.doctorName) {
    patch.doctorName = d.doctor;
  }
  if (row.credentials === previousCredentials && d.credentials !== previousCredentials) {
    patch.credentials = d.credentials;
  }
  if (Object.keys(patch).length === 0) return row;

  return prisma.clinicSettings.update({
    where: { id: "default" },
    data: patch,
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
    ensureJournalArticles(),
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
    savedDateSchedule: savedDates.map((row) => ({
      date: row.date,
      label: row.label || formatScheduleLabel(row.date),
      enabled: Boolean(row.enabled),
      slots: (row.slots ?? []).filter((slot) => /^\d{2}:\d{2}$/.test(slot)),
    })),
    dateSchedule: buildDateScheduleWindow(
      row.maxAdvanceDays,
      0,
      savedDates,
    ),
    bookingEnabled: row.bookingEnabled,
    minLeadDays: Math.max(SCHEDULE_ADJUSTMENT_LEAD_DAYS, row.minLeadDays),
    maxAdvanceDays: row.maxAdvanceDays,
    autoConfirm: row.autoConfirm,
    confirmationNote: row.confirmationNote,
    notifyEmail: row.notifyEmail,
    notifyOnBooking: row.notifyOnBooking,
    notifyOnContact: row.notifyOnContact,
    emergencyNote: row.emergencyNote,
  };
}

/** Bookable times for one calendar date — reads persisted schedule JSON first. */
export function getSlotsForDate(config: ClinicConfig, date: string): string[] {
  return getSlotsForSavedDate(config.savedDateSchedule, date);
}

export function isClinicClosedOn(config: ClinicConfig, date: string): boolean {
  return isDateClosedInSaved(config.savedDateSchedule, date);
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

export type JournalArticleItem = {
  id?: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  /** @deprecated use blocks — kept for admin textarea fallback */
  body: string[];
  blocks: JournalBlock[];
  imageUrl: string;
  publishedAt: string;
  readTime: string;
  active: boolean;
  sortOrder: number;
};

export async function ensureJournalArticles() {
  for (const [i, article] of articles.entries()) {
    const bodyJson = JSON.stringify(article.blocks);
    const existing = await prisma.journalArticle.findUnique({
      where: { slug: article.slug },
    });

    if (!existing) {
      await prisma.journalArticle.create({
        data: {
          slug: article.slug,
          title: article.title,
          category: article.category,
          excerpt: article.excerpt,
          bodyJson,
          imageUrl: article.imageUrl,
          publishedAt: article.publishedAt,
          readTime: article.readTime,
          active: true,
          sortOrder: i,
        },
      });
      continue;
    }

    // Upgrade legacy text-only seed articles to multi-image blocks once
    if (isLegacyStringBody(existing.bodyJson)) {
      await prisma.journalArticle.update({
        where: { slug: article.slug },
        data: {
          bodyJson,
          imageUrl: article.imageUrl,
          title: article.title,
          category: article.category,
          excerpt: article.excerpt,
          readTime: article.readTime,
        },
      });
    }
  }
  return prisma.journalArticle.findMany({
    orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
  });
}

function mapJournalRow(
  row: Awaited<ReturnType<typeof ensureJournalArticles>>[number],
): JournalArticleItem {
  const blocks = parseJournalBlocks(row.bodyJson);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    excerpt: row.excerpt,
    body: blocks
      .filter((b): b is Extract<JournalBlock, { type: "paragraph" }> => b.type === "paragraph")
      .map((b) => b.text),
    blocks,
    imageUrl: row.imageUrl || "/images/gallery-1.jpg",
    publishedAt: row.publishedAt,
    readTime: row.readTime,
    active: row.active,
    sortOrder: row.sortOrder,
  };
}

export async function getActiveJournalArticles(): Promise<JournalArticleItem[]> {
  const rows = await ensureJournalArticles();
  return rows.filter((r) => r.active).map(mapJournalRow);
}

export async function getAllJournalArticles(): Promise<JournalArticleItem[]> {
  const rows = await ensureJournalArticles();
  return rows.map(mapJournalRow);
}

export async function getJournalArticleBySlug(
  slug: string,
): Promise<JournalArticleItem | null> {
  await ensureJournalArticles();
  const row = await prisma.journalArticle.findUnique({ where: { slug } });
  if (!row || !row.active) return null;
  return mapJournalRow(row);
}

export { testimonials, articles };
