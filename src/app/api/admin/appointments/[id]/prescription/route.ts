import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { buildPrescriptionEmail, sendMail } from "@/lib/email";
import {
  buildPrescriptionHtml,
  buildPrescriptionText,
  defaultDoctorFromClinic,
  parsePrescriptionJson,
  type PrescriptionData,
} from "@/lib/prescription";
import { prisma } from "@/lib/prisma";
import {
  assertSameOrigin,
  forbiddenOrigin,
  readJsonLimited,
} from "@/lib/security";
import { getClinicConfig } from "@/lib/settings";
import { prescriptionSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

function patientPayload(appointment: {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  visitType: string;
}) {
  return {
    name: appointment.name,
    email: appointment.email,
    phone: appointment.phone,
    date: appointment.date,
    time: appointment.time,
    visitType: appointment.visitType,
    appointmentId: appointment.id,
  };
}

export async function GET(request: Request, { params }: Params) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id || id.length > 64) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const download = url.searchParams.get("download") === "1";
  const prescription = parsePrescriptionJson(appointment.prescriptionJson);

  if (!prescription) {
    return NextResponse.json(
      { error: "No prescription saved for this appointment yet" },
      { status: 404 },
    );
  }

  const clinic = await getClinicConfig();
  const doctor = defaultDoctorFromClinic(clinic);
  const html = buildPrescriptionHtml({
    doctor,
    patient: patientPayload(appointment),
    prescription,
    issuedAt: appointment.prescriptionIssuedAt,
    printable: true,
  });

  if (download) {
    const filename = `prescription-${appointment.name.replace(/\s+/g, "-").toLowerCase()}-${appointment.date}.html`;
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function POST(request: Request, { params }: Params) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!assertSameOrigin(request)) return forbiddenOrigin();

  const { id } = await params;
  if (!id || id.length > 64) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await readJsonLimited(request, 64_000);
  if (!body.ok) return body.response;

  const parsed = prescriptionSchema.safeParse(body.data);
  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message || "Invalid prescription data";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const prescription: PrescriptionData = {
    diagnosis: parsed.data.diagnosis,
    medicines: parsed.data.medicines.map((m) => ({
      name: m.name,
      dosage: m.dosage || "",
      frequency: m.frequency || "",
      duration: m.duration || "",
      instructions: m.instructions || "",
    })),
    advice: parsed.data.advice || "",
    followUp: parsed.data.followUp || "",
  };

  const now = new Date();
  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      prescriptionJson: JSON.stringify(prescription),
      prescriptionIssuedAt: now,
      status:
        appointment.status === "cancelled" ? appointment.status : "completed",
    },
  });

  let emailResult: { sent: boolean; reason?: string; demo?: boolean } | null =
    null;

  if (parsed.data.sendEmail) {
    const clinic = await getClinicConfig();
    const doctor = defaultDoctorFromClinic(clinic);
    const patient = patientPayload(updated);
    const mail = buildPrescriptionEmail({
      patientName: updated.name,
      doctorName: doctor.name,
      doctorRole: doctor.role,
      date: updated.date,
      time12: updated.time,
      prescriptionText: buildPrescriptionText({
        doctor,
        patient,
        prescription,
        issuedAt: now,
      }),
      prescriptionHtml: buildPrescriptionHtml({
        doctor,
        patient,
        prescription,
        issuedAt: now,
      }),
    });

    emailResult = await sendMail({
      to: updated.email,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });

    if (emailResult.sent) {
      await prisma.appointment.update({
        where: { id },
        data: { prescriptionSentAt: now },
      });
      updated.prescriptionSentAt = now;
    }
  }

  return NextResponse.json({
    ok: true,
    appointment: updated,
    email: emailResult,
  });
}
