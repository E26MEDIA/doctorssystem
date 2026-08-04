import { addDays, format } from "date-fns";
import { timeSlots as defaultTimeSlots } from "@/lib/clinic";

export type DateScheduleRow = {
  date: string;
  label: string;
  enabled: boolean;
  slots: string[];
};

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

export function isDateClosedInSchedule(
  schedule: DateScheduleRow[],
  date: string,
): boolean {
  const exact = schedule.find((row) => row.date === date);
  // Missing from schedule or explicitly Off = closed
  return !exact || !exact.enabled;
}
