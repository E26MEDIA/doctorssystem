import { NextResponse } from "next/server";
import {
  ensureAllSettings,
  getActiveServices,
  getBlockedDates,
  getClinicConfig,
} from "@/lib/settings";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/security";

/** Public-safe clinic payload — strips internal notification settings. */
function toPublicClinic(settings: Awaited<ReturnType<typeof getClinicConfig>>) {
  return {
    name: settings.name,
    doctor: settings.doctor,
    credentials: settings.credentials,
    tagline: settings.tagline,
    phone: settings.phone,
    email: settings.email,
    address: settings.address,
    hours: settings.hours,
    social: settings.social,
    timeSlots: settings.timeSlots,
    bookingEnabled: settings.bookingEnabled,
    minLeadDays: settings.minLeadDays,
    maxAdvanceDays: settings.maxAdvanceDays,
    confirmationNote: settings.confirmationNote,
    emergencyNote: settings.emergencyNote,
  };
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const limited = rateLimit(`clinic:${ip}`, 120, 60 * 1000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  await ensureAllSettings();
  const [settings, services, blockedDates] = await Promise.all([
    getClinicConfig(),
    getActiveServices(),
    getBlockedDates(),
  ]);

  return NextResponse.json({
    clinic: toPublicClinic(settings),
    services: services.map((s) => ({
      slug: s.slug,
      title: s.title,
      summary: s.summary,
      details: s.details,
      duration: s.duration,
    })),
    blockedDates: blockedDates.map((b) => b.date),
    timeSlots: settings.timeSlots,
  });
}
