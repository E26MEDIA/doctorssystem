/** Demo telehealth config for virtual consults. */

export function getDemoMeetLink(fallbackCode: string) {
  const fromEnv = process.env.NEXT_PUBLIC_GOOGLE_MEET_URL?.trim();
  if (fromEnv) return fromEnv;
  return `https://meet.google.com/${fallbackCode}`;
}

export function getVideoConsultFeeInr() {
  const raw = process.env.NEXT_PUBLIC_VIDEO_CONSULT_FEE?.trim();
  const n = raw ? Number(raw) : 799;
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 799;
}

export function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
