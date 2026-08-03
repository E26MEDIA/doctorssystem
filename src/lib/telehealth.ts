/** Demo telehealth config — swap Meet URL / fee later via env. */

export function getDemoMeetLink() {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_MEET_URL?.trim() ||
    "https://meet.google.com/abc-defg-hij"
  );
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

export function isOnlineVisit(visitType: string) {
  return visitType === "online";
}
