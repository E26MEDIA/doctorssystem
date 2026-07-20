import type { Metadata } from "next";
import { AppointmentForm } from "@/components/AppointmentForm";
import { Reveal } from "@/components/Reveal";
import { getClinicConfig } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const clinic = await getClinicConfig();
  return {
    title: "Book appointment",
    description: `Request a visit with ${clinic.doctor} at ${clinic.name}.`,
  };
}

export default async function BookPage() {
  const clinic = await getClinicConfig();

  return (
    <div className="pt-28">
      <section className="mx-auto max-w-6xl px-5 pb-20 md:grid md:grid-cols-[0.9fr_1.1fr] md:gap-16 md:px-8">
        <Reveal>
          <div className="mb-10 md:mb-0 md:sticky md:top-32 md:self-start">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--teal)]">
              Appointments
            </p>
            <h1 className="display mt-3 text-5xl md:text-6xl">
              Request a visit
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-[var(--ink-soft)]">
              {clinic.confirmationNote} For urgent symptoms, please seek
              emergency care.
            </p>
            <div className="mt-8 space-y-3 border-t border-[var(--line)] pt-8 text-sm text-[var(--ink-soft)]">
              <p>
                <span className="text-[var(--muted)]">Phone:</span> {clinic.phone}
              </p>
              <p>
                <span className="text-[var(--muted)]">Email:</span> {clinic.email}
              </p>
              <p>
                <span className="text-[var(--muted)]">Clinic:</span>{" "}
                {clinic.address.line1}, {clinic.address.line2}
              </p>
            </div>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-[0_20px_60px_rgba(10,27,51,0.08)] md:p-8">
            <AppointmentForm />
          </div>
        </Reveal>
      </section>
    </div>
  );
}
