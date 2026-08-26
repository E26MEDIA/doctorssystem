import { doctorProfile } from "@/lib/clinic";

export type PrescriptionMedicine = {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
};

export type PrescriptionData = {
  diagnosis: string;
  medicines: PrescriptionMedicine[];
  advice: string;
  followUp: string;
};

export type PrescriptionDoctor = {
  name: string;
  credentials: string;
  role: string;
  specialty: string;
  clinicName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
};

export type PrescriptionPatient = {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  visitType: string;
  appointmentId: string;
};

export function emptyPrescription(): PrescriptionData {
  return {
    diagnosis: "",
    medicines: [
      {
        name: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
      },
    ],
    advice: "",
    followUp: "",
  };
}

export function parsePrescriptionJson(
  raw: string | null | undefined,
): PrescriptionData | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as PrescriptionData;
    if (!data || typeof data !== "object") return null;
    return {
      diagnosis: data.diagnosis || "",
      medicines: Array.isArray(data.medicines)
        ? data.medicines.map((m) => ({
            name: m?.name || "",
            dosage: m?.dosage || "",
            frequency: m?.frequency || "",
            duration: m?.duration || "",
            instructions: m?.instructions || "",
          }))
        : [],
      advice: data.advice || "",
      followUp: data.followUp || "",
    };
  } catch {
    return null;
  }
}

export function defaultDoctorFromClinic(clinic: {
  doctor: string;
  credentials: string;
  name: string;
  phone: string;
  email: string;
  address: { line1: string; line2: string };
}): PrescriptionDoctor {
  return {
    name: clinic.doctor,
    credentials: clinic.credentials,
    role: doctorProfile.role,
    specialty: doctorProfile.specialty,
    clinicName: clinic.name,
    phone: clinic.phone,
    email: clinic.email,
    addressLine1: clinic.address.line1,
    addressLine2: clinic.address.line2,
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function visitLabel(visitType: string) {
  return visitType === "virtual-consultation"
    ? "Virtual consultation"
    : "Clinic consultation";
}

export function buildPrescriptionText(input: {
  doctor: PrescriptionDoctor;
  patient: PrescriptionPatient;
  prescription: PrescriptionData;
  issuedAt?: string | Date | null;
}) {
  const issued =
    input.issuedAt instanceof Date
      ? input.issuedAt.toLocaleString("en-IN")
      : input.issuedAt || new Date().toLocaleString("en-IN");

  const meds = input.prescription.medicines
    .filter((m) => m.name.trim())
    .map(
      (m, i) =>
        `${i + 1}. ${m.name}${m.dosage ? ` — ${m.dosage}` : ""}\n   Frequency: ${m.frequency || "—"}\n   Duration: ${m.duration || "—"}\n   Instructions: ${m.instructions || "—"}`,
    )
    .join("\n\n");

  return [
    input.doctor.clinicName.toUpperCase(),
    input.doctor.name,
    input.doctor.role,
    input.doctor.specialty,
    input.doctor.credentials,
    `${input.doctor.addressLine1}, ${input.doctor.addressLine2}`,
    `Phone: ${input.doctor.phone} · ${input.doctor.email}`,
    "",
    "PRESCRIPTION (Rx)",
    `Issued: ${issued}`,
    `Visit: ${visitLabel(input.patient.visitType)}`,
    `Consultation date: ${input.patient.date} at ${input.patient.time}`,
    "",
    `Patient: ${input.patient.name}`,
    `Email: ${input.patient.email}`,
    `Phone: ${input.patient.phone}`,
    "",
    `Diagnosis / clinical impression: ${input.prescription.diagnosis || "—"}`,
    "",
    "Medicines",
    meds || "—",
    "",
    `Advice: ${input.prescription.advice || "—"}`,
    `Follow-up: ${input.prescription.followUp || "—"}`,
    "",
    "________________________",
    input.doctor.name,
    input.doctor.role,
    input.doctor.specialty,
    input.doctor.credentials,
    "",
    "This prescription is issued after clinical consultation. For emergencies, seek local emergency care.",
  ].join("\n");
}

export function buildPrescriptionHtml(input: {
  doctor: PrescriptionDoctor;
  patient: PrescriptionPatient;
  prescription: PrescriptionData;
  issuedAt?: string | Date | null;
  printable?: boolean;
}) {
  const issued =
    input.issuedAt instanceof Date
      ? input.issuedAt.toLocaleString("en-IN")
      : input.issuedAt || new Date().toLocaleString("en-IN");

  const medRows = input.prescription.medicines
    .filter((m) => m.name.trim())
    .map(
      (m, i) => `
      <tr>
        <td style="padding:8px;border:1px solid #d5e3dd;vertical-align:top">${i + 1}</td>
        <td style="padding:8px;border:1px solid #d5e3dd;vertical-align:top"><strong>${escapeHtml(m.name)}</strong></td>
        <td style="padding:8px;border:1px solid #d5e3dd;vertical-align:top">${escapeHtml(m.dosage || "—")}</td>
        <td style="padding:8px;border:1px solid #d5e3dd;vertical-align:top">${escapeHtml(m.frequency || "—")}</td>
        <td style="padding:8px;border:1px solid #d5e3dd;vertical-align:top">${escapeHtml(m.duration || "—")}</td>
        <td style="padding:8px;border:1px solid #d5e3dd;vertical-align:top">${escapeHtml(m.instructions || "—")}</td>
      </tr>`,
    )
    .join("");

  const body = `
  <div style="font-family:Georgia,serif;color:#10241f;max-width:800px;margin:0 auto;padding:24px;border:1px solid #d5e3dd;background:#fff">
    <div style="border-bottom:2px solid #0f766e;padding-bottom:16px;margin-bottom:20px">
      <p style="margin:0;letter-spacing:0.18em;font-size:11px;text-transform:uppercase;color:#0f766e">${escapeHtml(input.doctor.clinicName)}</p>
      <h1 style="margin:8px 0 4px;font-size:28px;color:#06332c">${escapeHtml(input.doctor.name)}</h1>
      <p style="margin:0;font-size:14px;color:#3d5a52">${escapeHtml(input.doctor.role)}</p>
      <p style="margin:2px 0 0;font-size:14px;color:#3d5a52">${escapeHtml(input.doctor.specialty)}</p>
      <p style="margin:6px 0 0;font-size:13px;color:#6b8179">${escapeHtml(input.doctor.credentials)}</p>
      <p style="margin:10px 0 0;font-size:12px;color:#6b8179">
        ${escapeHtml(input.doctor.addressLine1)}, ${escapeHtml(input.doctor.addressLine2)}<br/>
        ${escapeHtml(input.doctor.phone)} · ${escapeHtml(input.doctor.email)}
      </p>
    </div>

    <div style="display:flex;justify-content:space-between;gap:16px;margin-bottom:18px">
      <div>
        <p style="margin:0;font-size:22px;font-weight:700;color:#0f766e">℞ Prescription</p>
        <p style="margin:6px 0 0;font-size:13px;color:#6b8179">Ref: ${escapeHtml(input.patient.appointmentId.slice(0, 10).toUpperCase())}</p>
      </div>
      <div style="text-align:right;font-size:13px;color:#3d5a52">
        <p style="margin:0"><strong>Issued:</strong> ${escapeHtml(issued)}</p>
        <p style="margin:4px 0 0"><strong>Visit:</strong> ${escapeHtml(visitLabel(input.patient.visitType))}</p>
        <p style="margin:4px 0 0"><strong>Consult:</strong> ${escapeHtml(input.patient.date)} · ${escapeHtml(input.patient.time)}</p>
      </div>
    </div>

    <div style="background:#f3f7f5;border-radius:12px;padding:14px 16px;margin-bottom:18px;font-size:14px">
      <p style="margin:0"><strong>Patient:</strong> ${escapeHtml(input.patient.name)}</p>
      <p style="margin:4px 0 0"><strong>Email:</strong> ${escapeHtml(input.patient.email)}</p>
      <p style="margin:4px 0 0"><strong>Phone:</strong> ${escapeHtml(input.patient.phone)}</p>
    </div>

    <p style="margin:0 0 8px;font-size:14px"><strong>Diagnosis / clinical impression</strong></p>
    <p style="margin:0 0 18px;font-size:14px;color:#3d5a52">${escapeHtml(input.prescription.diagnosis || "—")}</p>

    <p style="margin:0 0 8px;font-size:14px"><strong>Medicines</strong></p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:18px">
      <thead>
        <tr style="background:#e8f0ec">
          <th style="padding:8px;border:1px solid #d5e3dd;text-align:left">#</th>
          <th style="padding:8px;border:1px solid #d5e3dd;text-align:left">Medicine</th>
          <th style="padding:8px;border:1px solid #d5e3dd;text-align:left">Dosage</th>
          <th style="padding:8px;border:1px solid #d5e3dd;text-align:left">Frequency</th>
          <th style="padding:8px;border:1px solid #d5e3dd;text-align:left">Duration</th>
          <th style="padding:8px;border:1px solid #d5e3dd;text-align:left">Instructions</th>
        </tr>
      </thead>
      <tbody>
        ${medRows || `<tr><td colspan="6" style="padding:8px;border:1px solid #d5e3dd">No medicines listed</td></tr>`}
      </tbody>
    </table>

    <p style="margin:0 0 8px;font-size:14px"><strong>Advice</strong></p>
    <p style="margin:0 0 14px;font-size:14px;color:#3d5a52;white-space:pre-wrap">${escapeHtml(input.prescription.advice || "—")}</p>

    <p style="margin:0 0 8px;font-size:14px"><strong>Follow-up</strong></p>
    <p style="margin:0 0 28px;font-size:14px;color:#3d5a52">${escapeHtml(input.prescription.followUp || "—")}</p>

    <div style="margin-top:40px;text-align:right">
      <p style="margin:0 0 28px;color:#6b8179;font-size:12px">Authorised signature</p>
      <p style="margin:0;font-size:16px;font-weight:700;color:#06332c">${escapeHtml(input.doctor.name)}</p>
      <p style="margin:2px 0 0;font-size:13px;color:#3d5a52">${escapeHtml(input.doctor.role)}</p>
      <p style="margin:2px 0 0;font-size:13px;color:#3d5a52">${escapeHtml(input.doctor.specialty)}</p>
      <p style="margin:2px 0 0;font-size:12px;color:#6b8179">${escapeHtml(input.doctor.credentials)}</p>
    </div>

    <p style="margin:28px 0 0;font-size:11px;color:#6b8179;border-top:1px solid #d5e3dd;padding-top:12px">
      This prescription is issued after clinical consultation with ${escapeHtml(input.doctor.name)}.
      Not for emergencies — call local emergency services if needed.
    </p>
  </div>`;

  if (!input.printable) return body;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Prescription — ${escapeHtml(input.patient.name)}</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none !important; }
    }
    body { background: #eef5f2; margin: 0; padding: 24px; }
    .actions { max-width: 800px; margin: 0 auto 16px; display: flex; gap: 10px; }
    .actions button, .actions a {
      display: inline-flex; align-items: center; justify-content: center;
      border-radius: 999px; padding: 10px 16px; font: 500 14px system-ui, sans-serif;
      text-decoration: none; cursor: pointer; border: 0;
    }
    .primary { background: #06332c; color: #fff; }
    .ghost { background: #fff; color: #06332c; border: 1px solid #d5e3dd !important; }
  </style>
</head>
<body>
  <div class="actions no-print">
    <button class="primary" onclick="window.print()">Print / Save as PDF</button>
  </div>
  ${body}
</body>
</html>`;
}
