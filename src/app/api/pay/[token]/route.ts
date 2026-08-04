import { NextResponse } from "next/server";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { checkoutPaymentSchema } from "@/lib/validators";
import { getClinicConfig } from "@/lib/settings";
import {
  buildPaymentReceiptEmail,
  sendMail,
} from "@/lib/email";
import {
  assertSameOrigin,
  forbiddenOrigin,
  getClientIp,
  rateLimit,
  rateLimitResponse,
  readJsonLimited,
} from "@/lib/security";
import {
  formatInr,
  getDemoMeetLink,
  getVideoConsultFeeInr,
} from "@/lib/telehealth";

type Ctx = { params: Promise<{ token: string }> };

function to12h(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function meetCodeFromSeed(seed: string) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let n = 0;
  for (let i = 0; i < seed.length; i += 1) n = (n * 31 + seed.charCodeAt(i)) >>> 0;
  const part = (len: number) => {
    let out = "";
    let x = n;
    for (let i = 0; i < len; i += 1) {
      out += alphabet[x % 26];
      x = Math.floor(x / 26) || n + i + 1;
    }
    return out;
  };
  return `${part(3)}-${part(4)}-${part(3)}`;
}

function methodLabel(method: string) {
  switch (method) {
    case "upi":
      return "UPI";
    case "debit":
      return "Debit card";
    case "credit":
      return "Credit card";
    case "netbanking":
      return "Net banking";
    default:
      return method;
  }
}

function validateCheckout(
  data: ReturnType<typeof checkoutPaymentSchema.parse>,
): string | null {
  if (data.method === "upi") {
    if (!data.upiId || !/^[\w.-]+@[\w.-]+$/.test(data.upiId.trim())) {
      return "Enter a valid UPI ID (e.g. name@oksbi)";
    }
    return null;
  }
  if (data.method === "netbanking") {
    if (!data.bank || data.bank.trim().length < 2) {
      return "Select your bank";
    }
    return null;
  }
  const digits = (data.cardNumber || "").replace(/\s+/g, "");
  if (!data.cardName || data.cardName.trim().length < 2) {
    return "Enter the name on the card";
  }
  if (!/^\d{12,19}$/.test(digits)) return "Enter a valid card number";
  if (!data.expiry || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(data.expiry.trim())) {
    return "Enter expiry as MM/YY";
  }
  if (!data.cvv || !/^\d{3,4}$/.test(data.cvv.trim())) {
    return "Enter a valid CVV";
  }
  return null;
}

export async function GET(request: Request, context: Ctx) {
  const ip = getClientIp(request);
  const limited = rateLimit(`pay-get:${ip}`, 60, 60 * 1000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const { token } = await context.params;
  const appointment = await prisma.appointment.findFirst({
    where: { payToken: token },
  });
  if (!appointment) {
    return NextResponse.json({ error: "Payment link not found" }, { status: 404 });
  }

  const clinic = await getClinicConfig();
  const fee = appointment.paymentAmount || getVideoConsultFeeInr();
  const meetCode = appointment.meetLink
    ? appointment.meetLink.replace("https://meet.google.com/", "")
    : null;

  return NextResponse.json({
    clinic: { name: clinic.name, doctor: clinic.doctor },
    appointment: {
      name: appointment.name,
      email: appointment.email,
      date: appointment.date,
      time: appointment.time,
      timeLabel: to12h(appointment.time),
      service: appointment.service,
      status: appointment.status,
      paymentStatus: appointment.paymentStatus,
      paymentAmount: fee,
      paymentAmountLabel: formatInr(fee),
      paymentRef: appointment.paymentRef,
      paymentMethod: appointment.paymentMethod,
    },
    meetLink: appointment.meetLink,
    meetCode,
    paid: appointment.paymentStatus === "paid",
  });
}

export async function POST(request: Request, context: Ctx) {
  if (!assertSameOrigin(request)) return forbiddenOrigin();

  const ip = getClientIp(request);
  const limited = rateLimit(`pay-post:${ip}`, 12, 15 * 60 * 1000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const { token } = await context.params;
  const appointment = await prisma.appointment.findFirst({
    where: { payToken: token, visitType: "virtual-consultation" },
  });
  if (!appointment) {
    return NextResponse.json({ error: "Payment link not found" }, { status: 404 });
  }

  if (appointment.status === "cancelled") {
    return NextResponse.json(
      { error: "This booking was cancelled" },
      { status: 400 },
    );
  }

  const clinic = await getClinicConfig();
  const fee = appointment.paymentAmount || getVideoConsultFeeInr();

  if (appointment.paymentStatus === "paid" && appointment.meetLink) {
    const meetCode = appointment.meetLink
      .replace("https://meet.google.com/", "")
      .replace(/\/$/, "");
    return NextResponse.json({
      ok: true,
      alreadyPaid: true,
      meetLink: appointment.meetLink,
      meetCode,
      paymentRef: appointment.paymentRef,
      paymentAmountLabel: formatInr(fee),
      emailSent: true,
      message: "Already paid — your Meet link is ready.",
    });
  }

  const body = await readJsonLimited(request);
  if (!body.ok) return body.response;

  const parsed = checkoutPaymentSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment details" }, { status: 400 });
  }

  const invalid = validateCheckout(parsed.data);
  if (invalid) {
    return NextResponse.json({ error: invalid }, { status: 400 });
  }

  const seed = `${appointment.email}-${appointment.date}-${appointment.time}-virtual`;
  const generatedCode = meetCodeFromSeed(seed);
  const meetLink = getDemoMeetLink(generatedCode);
  const meetCode = meetLink
    .replace("https://meet.google.com/", "")
    .replace(/\/$/, "");
  const paymentRef = `HGI-${Date.now().toString(36).toUpperCase()}`;
  const method = methodLabel(parsed.data.method);
  const time12 = to12h(appointment.time);
  const amountLabel = formatInr(fee);

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: {
      paymentStatus: "paid",
      paymentAmount: fee,
      paymentRef,
      paymentMethod: method,
      meetLink,
      status: "confirmed",
    },
  });

  const mail = buildPaymentReceiptEmail({
    patientName: appointment.name,
    date: appointment.date,
    time12,
    meetLink,
    meetCode,
    doctorName: clinic.doctor,
    amountLabel,
    paymentRef,
    paymentMethod: method,
  });

  const result = await sendMail({
    to: appointment.email,
    subject: mail.subject,
    text: mail.text,
  });

  if (clinic.notifyOnBooking && clinic.notifyEmail) {
    const whenLabel = format(
      new Date(`${appointment.date}T00:00:00`),
      "EEEE, d MMMM yyyy",
    );
    await sendMail({
      to: clinic.notifyEmail,
      subject: `Paid virtual booking — ${whenLabel} at ${time12}`,
      text: `${appointment.name} paid ${amountLabel} (${paymentRef}) for a virtual visit.\nDate: ${whenLabel}\nTime: ${time12}\nMeet: ${meetLink}\nPhone: ${appointment.phone}\nEmail: ${appointment.email}`,
    });
  }

  return NextResponse.json({
    ok: true,
    demo: true,
    meetLink,
    meetCode,
    paymentRef,
    paymentMethod: method,
    paymentAmountLabel: amountLabel,
    emailSent: result.sent,
    emailDemo: Boolean(result.demo),
    emailTo: appointment.email,
    message: result.sent
      ? `Payment successful. Meet link and receipt sent to ${appointment.email}.`
      : "Payment successful. Meet link is ready below.",
  });
}
