type MailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

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
      html: payload.html || `<pre style="font-family:sans-serif;white-space:pre-wrap">${payload.text}</pre>`,
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
  const subject = `Virtual consultation confirmed — ${input.date} at ${input.time12}`;
  const text = [
    `Hi ${input.patientName},`,
    "",
    `Your virtual consultation with ${input.doctorName} is confirmed.`,
    "",
    `Date: ${input.date}`,
    `Time: ${input.time12}`,
    "",
    "Google Meet link:",
    input.meetLink,
    "",
    `Meeting code: ${input.meetCode}`,
    "",
    "Please save this email or screenshot the confirmation page.",
    "Join a few minutes early on the scheduled time.",
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
  const subject = `Payment receipt & Meet link — ${input.date} at ${input.time12}`;
  const text = [
    `Hi ${input.patientName},`,
    "",
    `Thank you. Your consultation fee payment is confirmed.`,
    "",
    "— Payment receipt —",
    `Amount: ${input.amountLabel}`,
    `Reference: ${input.paymentRef}`,
    `Method: ${input.paymentMethod}`,
    `Status: Paid (demo gateway)`,
    "",
    "— Appointment —",
    `Doctor: ${input.doctorName}`,
    `Date: ${input.date}`,
    `Time: ${input.time12}`,
    `Type: Virtual consultation`,
    "",
    "— Google Meet —",
    input.meetLink,
    `Meeting code: ${input.meetCode}`,
    "",
    "Join a few minutes before your scheduled time.",
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
  const subject = `Clinic visit confirmed — ${input.date} at ${input.time12}`;
  const text = [
    `Hi ${input.patientName},`,
    "",
    `Your clinic consultation with ${input.doctorName} is confirmed.`,
    "",
    `Date: ${input.date}`,
    `Time: ${input.time12}`,
    "",
    input.note,
    "",
    "— Honnani GI Surgery",
  ].join("\n");

  return { subject, text };
}
