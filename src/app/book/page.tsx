import type { Metadata } from "next";
import Image from "next/image";
import { AppointmentForm } from "@/components/AppointmentForm";
import { Reveal } from "@/components/Reveal";
import { getClinicConfig } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const clinic = await getClinicConfig();
  return {
    title: "Book consultation",
    description: `Book clinic or virtual consultation with ${clinic.doctor}.`,
  };
}

export default async function BookPage() {
  const clinic = await getClinicConfig();

  return (
    <div className="pt-28">
      <section className="mx-auto max-w-6xl px-5 pb-10 md:px-8">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--teal)]">
            Appointments
          </p>
          <h1 className="display mt-3 max-w-3xl text-5xl md:text-6xl">
            Book an open slot
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-[var(--ink-soft)]">
            Choose clinic or virtual consultation. Slots are set by the doctor
            each week — if it is available, your booking is confirmed instantly.
            Virtual visits receive a Google Meet link by email.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-20 md:grid-cols-[0.85fr_1.15fr] md:gap-14 md:px-8">
        <Reveal>
          <div className="space-y-6 md:sticky md:top-32 md:self-start">
            <div className="relative aspect-[5/4] overflow-hidden rounded-[1.4rem]">
              <Image
                src="/images/clinic.jpg"
                alt="Clinic consultation setting"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
            </div>
            <div className="rounded-[1.2rem] border border-[var(--line)] bg-white/80 p-6 text-sm text-[var(--ink-soft)]">
              <p className="font-medium text-[var(--deep)]">What happens next</p>
              <ul className="mt-3 space-y-2">
                <li>1. Pick visit type, date, and an open slot.</li>
                <li>2. Booking confirms immediately if the slot is free.</li>
                <li>3. You and the doctor both get email details.</li>
                <li>4. Virtual visits include the Google Meet link.</li>
              </ul>
              <div className="mt-5 space-y-2 border-t border-[var(--line)] pt-5">
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
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div className="rounded-[1.5rem] border border-[var(--line)] bg-white p-6 shadow-[0_24px_60px_rgba(6,51,44,0.08)] md:p-8">
            <AppointmentForm />
          </div>
        </Reveal>
      </section>
    </div>
  );
}
