import { addDays, format } from "date-fns";
import { timeSlots as defaultTimeSlots } from "@/lib/clinic";

export type DateScheduleRow = {
  date: string;
  label: string;
  enabled: boolean;
  slots: string[];
};

/** Schedule edits (open/off, times) must be at least this many days ahead. */
export const SCHEDULE_ADJUSTMENT_LEAD_DAYS = 7;

export function formatScheduleLabel(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return format(d, "EEE, d MMM yyyy");
}

/**
 * Build bookable calendar days for admin + booking.
 * Each date is independent — no weekday template.
 * Unsaved dates start Off with no slots until the doctor opens them.
 */
export function buildDateScheduleWindow(
  days: number,
  leadDays: number,
  saved: DateScheduleRow[] = [],
  options?: { fillDefaults?: boolean },
): DateScheduleRow[] {
  const fillDefaults = options?.fillDefaults ?? false;
  const count = Math.max(1, Math.min(Math.floor(days) || 1, 90));
  const lead = Math.max(0, Math.floor(leadDays) || 0);
  const savedMap = new Map(saved.map((row) => [row.date, row]));
  const start = addDays(new Date(), lead);
  start.setHours(0, 0, 0, 0);

  return Array.from({ length: count }, (_, i) => {
    const date = format(addDays(start, i), "yyyy-MM-dd");
    const existing = savedMap.get(date);
    const weekday = addDays(start, i).getDay(); // 0 Sun
    if (existing) {
      return {
        date,
        label: formatScheduleLabel(date),
        enabled: Boolean(existing.enabled),
        slots: (existing.slots ?? []).filter((slot) =>
          /^\d{2}:\d{2}$/.test(slot),
        ),
      };
    }
    if (fillDefaults) {
      return {
        date,
        label: formatScheduleLabel(date),
        enabled: weekday !== 0,
        slots: weekday !== 0 ? [...defaultTimeSlots] : [],
      };
    }
    return {
      date,
      label: formatScheduleLabel(date),
      enabled: false,
      slots: [],
    };
  });
}

export function getSlotsForDateRow(
  schedule: DateScheduleRow[],
  date: string,
): string[] {
  const exact = schedule.find((row) => row.date === date);
  if (!exact || !exact.enabled) return [];
  return exact.slots;
}

/** Read slots for a date directly from persisted schedule JSON (source of truth). */
export function getSlotsForSavedDate(
  saved: DateScheduleRow[],
  date: string,
): string[] {
  const exact = saved.find((row) => row.date === date);
  if (!exact || !exact.enabled) return [];
  return (exact.slots ?? []).filter((slot) => /^\d{2}:\d{2}$/.test(slot));
}

export function isDateClosedInSaved(
  saved: DateScheduleRow[],
  date: string,
): boolean {
  const exact = saved.find((row) => row.date === date);
  return !exact || !exact.enabled;
}

export function isDateClosedInSchedule(
  schedule: DateScheduleRow[],
  date: string,
): boolean {
  const exact = schedule.find((row) => row.date === date);
  // Missing from schedule or explicitly Off = closed
  return !exact || !exact.enabled;
}

export function getScheduleEditCutoffDate(
  leadDays = SCHEDULE_ADJUSTMENT_LEAD_DAYS,
): string {
  const d = addDays(new Date(), leadDays);
  d.setHours(0, 0, 0, 0);
  return format(d, "yyyy-MM-dd");
}

/** Dates on or before the cutoff cannot be edited in admin (7-day adjustment rule). */
export function isScheduleDateEditable(
  date: string,
  leadDays = SCHEDULE_ADJUSTMENT_LEAD_DAYS,
): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  return date >= getScheduleEditCutoffDate(leadDays);
}

export function scheduleRowsEqual(a: DateScheduleRow, b: DateScheduleRow): boolean {
  if (a.enabled !== b.enabled) return false;
  const as = [...a.slots].sort();
  const bs = [...b.slots].sort();
  if (as.length !== bs.length) return false;
  return as.every((slot, i) => slot === bs[i]);
}
