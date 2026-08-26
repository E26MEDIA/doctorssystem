"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  emptyPrescription,
  parsePrescriptionJson,
  type PrescriptionData,
  type PrescriptionMedicine,
} from "@/lib/prescription";

type AppointmentLike = {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  visitType?: string;
  prescriptionJson?: string | null;
  prescriptionSentAt?: string | null;
  prescriptionIssuedAt?: string | null;
};

type Props = {
  appointment: AppointmentLike;
  doctorName: string;
  doctorRole: string;
  doctorSpecialty: string;
  credentials: string;
  onClose: () => void;
  onSaved: () => void;
  adminFetch: (url: string, init?: RequestInit) => Promise<Response>;
};

function blankMedicine(): PrescriptionMedicine {
  return {
    name: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
  };
}

export function PrescriptionEditor({
  appointment,
  doctorName,
  doctorRole,
  doctorSpecialty,
  credentials,
  onClose,
  onSaved,
  adminFetch,
}: Props) {
  const [form, setForm] = useState<PrescriptionData>(emptyPrescription());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const existing = parsePrescriptionJson(appointment.prescriptionJson);
    setForm(existing ?? emptyPrescription());
    setMessage("");
    setError("");
  }, [appointment]);

  function updateMedicine(
    index: number,
    key: keyof PrescriptionMedicine,
    value: string,
  ) {
    setForm((prev) => ({
      ...prev,
      medicines: prev.medicines.map((m, i) =>
        i === index ? { ...m, [key]: value } : m,
      ),
    }));
  }

  function addMedicine() {
    setForm((prev) => ({
      ...prev,
      medicines: [...prev.medicines, blankMedicine()],
    }));
  }

  function removeMedicine(index: number) {
    setForm((prev) => ({
      ...prev,
      medicines:
        prev.medicines.length <= 1
          ? [blankMedicine()]
          : prev.medicines.filter((_, i) => i !== index),
    }));
  }

  async function submit(sendEmail: boolean) {
    setSaving(true);
    setError("");
    setMessage("");
    const res = await adminFetch(
      `/api/admin/appointments/${appointment.id}/prescription`,
      {
        method: "POST",
        body: JSON.stringify({ ...form, sendEmail }),
      },
    );
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not save prescription");
      return;
    }
    if (sendEmail) {
      if (data.email?.sent) {
        setMessage(
          data.email.demo
            ? `Saved. Email logged in demo mode to ${appointment.email} (configure SMTP for live delivery).`
            : `Saved and emailed to ${appointment.email}.`,
        );
      } else {
        setMessage(
          `Saved, but email failed${data.email?.reason ? `: ${data.email.reason}` : "."}`,
        );
      }
    } else {
      setMessage("Prescription saved.");
    }
    onSaved();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await submit(false);
  }

  function downloadPrescription() {
    window.open(
      `/api/admin/appointments/${appointment.id}/prescription?download=1`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function previewPrescription() {
    window.open(
      `/api/admin/appointments/${appointment.id}/prescription`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  const hasSaved = Boolean(appointment.prescriptionJson);

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/45 p-4 sm:items-center">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[1.25rem] border border-[var(--line)] bg-white shadow-[0_24px_60px_rgba(6,51,44,0.25)]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[var(--line)] bg-white px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--teal)]">
              Prescription (Rx)
            </p>
            <h3 className="display mt-1 text-2xl text-[var(--deep)]">
              {appointment.name}
            </h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {appointment.date} · {appointment.time} ·{" "}
              {appointment.visitType === "virtual-consultation"
                ? "Virtual consultation"
                : "Clinic consultation"}
            </p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              Sends to registered email:{" "}
              <strong className="text-[var(--ink)]">{appointment.email}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--line)] px-3 py-1 text-sm"
          >
            Close
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 px-5 py-5">
          <div className="rounded-xl border border-[var(--line)] bg-[var(--sand)]/60 px-4 py-3 text-sm text-[var(--ink-soft)]">
            <p className="font-medium text-[var(--deep)]">{doctorName}</p>
            <p>{doctorRole}</p>
            <p>{doctorSpecialty}</p>
            <p className="mt-1 text-[var(--muted)]">{credentials}</p>
          </div>

          <label className="field">
            <span>Diagnosis / clinical impression</span>
            <textarea
              rows={2}
              required
              value={form.diagnosis}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, diagnosis: e.target.value }))
              }
              placeholder="e.g. Anal fissure — acute"
            />
          </label>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-[var(--deep)]">Medicines</p>
              <button
                type="button"
                onClick={addMedicine}
                className="text-sm font-medium text-[var(--teal)]"
              >
                + Add medicine
              </button>
            </div>
            <div className="space-y-4">
              {form.medicines.map((med, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-[var(--line)] bg-white p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
                      Medicine {index + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeMedicine(index)}
                      className="text-xs text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="field md:col-span-2">
                      <span>Name</span>
                      <input
                        required
                        value={med.name}
                        onChange={(e) =>
                          updateMedicine(index, "name", e.target.value)
                        }
                        placeholder="Medicine name"
                      />
                    </label>
                    <label className="field">
                      <span>Dosage</span>
                      <input
                        value={med.dosage}
                        onChange={(e) =>
                          updateMedicine(index, "dosage", e.target.value)
                        }
                        placeholder="e.g. 500 mg"
                      />
                    </label>
                    <label className="field">
                      <span>Frequency</span>
                      <input
                        value={med.frequency}
                        onChange={(e) =>
                          updateMedicine(index, "frequency", e.target.value)
                        }
                        placeholder="e.g. 1-0-1 after food"
                      />
                    </label>
                    <label className="field">
                      <span>Duration</span>
                      <input
                        value={med.duration}
                        onChange={(e) =>
                          updateMedicine(index, "duration", e.target.value)
                        }
                        placeholder="e.g. 5 days"
                      />
                    </label>
                    <label className="field">
                      <span>Instructions</span>
                      <input
                        value={med.instructions}
                        onChange={(e) =>
                          updateMedicine(index, "instructions", e.target.value)
                        }
                        placeholder="e.g. Apply locally / with water"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <label className="field">
            <span>Advice</span>
            <textarea
              rows={3}
              value={form.advice}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, advice: e.target.value }))
              }
              placeholder="Diet, activity, warning signs…"
            />
          </label>

          <label className="field">
            <span>Follow-up</span>
            <input
              value={form.followUp}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, followUp: e.target.value }))
              }
              placeholder="e.g. Review after 7 days / SOS"
            />
          </label>

          {error && <p className="text-sm text-red-700">{error}</p>}
          {message && <p className="text-sm text-[var(--teal)]">{message}</p>}
          {appointment.prescriptionSentAt && (
            <p className="text-xs text-[var(--muted)]">
              Last emailed:{" "}
              {new Date(appointment.prescriptionSentAt).toLocaleString("en-IN")}
            </p>
          )}

          <div className="flex flex-wrap gap-3 border-t border-[var(--line)] pt-4">
            <button type="submit" className="btn-ghost" disabled={saving}>
              {saving ? "Saving…" : "Save prescription"}
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={saving}
              onClick={() => submit(true)}
            >
              Save & email to patient
            </button>
            {hasSaved && (
              <>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={previewPrescription}
                >
                  Preview / print
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={downloadPrescription}
                >
                  Download prescription
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
