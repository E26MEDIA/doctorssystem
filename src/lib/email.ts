import { format, parseISO } from "date-fns";

type MailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function formatBookingDate(isoDate: string): string {
  try {
    return format(parseISO(isoDate), "EEEE, d MMMM yyyy");
  } catch {
    return isoDate;
  }
}

function bookingWhen(date: string, time12: string): string {
  return `${formatBookingDate(date)} at ${time12}`;
}

/**
 * Sends email when SMTP_* env vars are set.
 * Always returns whether delivery was attempted successfully.
 */
export async function sendMail(payload: MailPayload): Promise<{
  sent: boolean;
  reason?: string;
  demo?: boolean;
}> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from =
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    "noreply@drhonnani.com";

  if (!host || !user || !pass) {
    // Demo mode: treat as delivered so checkout UX matches production
    console.info("[email:demo] SMTP not configured — logging message", {
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
    });
    return { sent: true, reason: "demo-log", demo: true };
  }

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html:
        payload.html ||
        `<pre style="font-family:sans-serif;white-space:pre-wrap">${payload.text}</pre>`,
    });

    return { sent: true };
  } catch (error) {
    console.error("[email] send failed", error);
    return { sent: false, reason: "SMTP send failed" };
  }
}

export function buildVirtualConfirmEmail(input: {
  patientName: string;
  date: string;
  time12: string;
  meetLink: string;
  meetCode: string;
  doctorName: string;
}) {
  const when = bookingWhen(input.date, input.time12);
  const subject = `Virtual consultation confirmed — ${when}`;
  const text = [
    `Hi ${input.patientName},`,
    "",
    `Your virtual consultation with ${input.doctorName} is confirmed.`,
    "",
    "YOUR BOOKING",
    `Date: ${formatBookingDate(input.date)}`,
    `Time: ${input.time12}`,
    "",
    "Please join at the scheduled time above.",
    "",
    "Google Meet link:",
    input.meetLink,
    "",
    `Meeting code: ${input.meetCode}`,
    "",
    "Join a few minutes early.",
    "",
    "— Honnani GI Surgery",
  ].join("\n");

  return { subject, text };
}

export function buildPaymentReceiptEmail(input: {
  patientName: string;
  date: string;
  time12: string;
  meetLink: string;
  meetCode: string;
  doctorName: string;
  amountLabel: string;
  paymentRef: string;
  paymentMethod: string;
}) {
  const when = bookingWhen(input.date, input.time12);
  const subject = `Your appointment — ${when}`;
  const text = [
    `Hi ${input.patientName},`,
    "",
    `Thank you. Your consultation fee is paid and your visit is confirmed.`,
    "",
    "YOUR BOOKING TIME",
    `Doctor: ${input.doctorName}`,
    `Date: ${formatBookingDate(input.date)}`,
    `Time: ${input.time12}`,
    `Type: Virtual consultation`,
    "",
    `Please join Google Meet at ${input.time12} on ${formatBookingDate(input.date)}.`,
    "",
    "Google Meet link:",
    input.meetLink,
    "",
    `Meeting code: ${input.meetCode}`,
    "",
    "PAYMENT RECEIPT",
    `Amount: ${input.amountLabel}`,
    `Reference: ${input.paymentRef}`,
    `Method: ${input.paymentMethod}`,
    `Status: Paid`,
    "",
    "— Honnani GI Surgery",
    "Yenepoya Specialty Hospital, Mangaluru",
  ].join("\n");

  return { subject, text };
}

export function buildClinicConfirmEmail(input: {
  patientName: string;
  date: string;
  time12: string;
  doctorName: string;
  note: string;
}) {
  const when = bookingWhen(input.date, input.time12);
  const subject = `Clinic visit confirmed — ${when}`;
  const text = [
    `Hi ${input.patientName},`,
    "",
    `Your clinic consultation with ${input.doctorName} is confirmed.`,
    "",
    "YOUR BOOKING TIME",
    `Date: ${formatBookingDate(input.date)}`,
    `Time: ${input.time12}`,
    "",
    `Please arrive at the clinic for your appointment at ${input.time12} on ${formatBookingDate(input.date)}.`,
    "",
    input.note,
    "",
    "— Honnani GI Surgery",
  ].join("\n");

  return { subject, text };
}

export function buildPrescriptionEmail(input: {
  patientName: string;
  doctorName: string;
  doctorRole: string;
  date: string;
  time12: string;
  prescriptionText: string;
  prescriptionHtml: string;
}) {
  const when = bookingWhen(input.date, input.time12);
  const subject = `Your prescription from ${input.doctorName} — ${when}`;
  const text = [
    `Hi ${input.patientName},`,
    "",
    `Please find your prescription from ${input.doctorName} (${input.doctorRole}) after your consultation on ${when}.`,
    "",
    "You can save this email or download the prescription from the clinic admin link if provided.",
    "",
    "— — — PRESCRIPTION — — —",
    "",
    input.prescriptionText,
    "",
    "— Honnani GI Surgery",
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,sans-serif;color:#10241f;line-height:1.5">
      <p>Hi ${input.patientName},</p>
      <p>Please find your prescription from <strong>${input.doctorName}</strong> (${input.doctorRole}) after your consultation on <strong>${when}</strong>.</p>
      <p style="color:#6b8179;font-size:13px">Keep this email for your records. You may also print or save the attached prescription format below.</p>
      <hr style="border:none;border-top:1px solid #d5e3dd;margin:24px 0" />
      ${input.prescriptionHtml}
    </div>
  `;

  return { subject, text, html };
}
