import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { Reveal } from "@/components/Reveal";
import { getClinicConfig } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const clinic = await getClinicConfig();
  return {
    title: "Contact",
    description: `Contact ${clinic.name}.`,
  };
}

export default async function ContactPage() {
  const clinic = await getClinicConfig();

  return (
    <div className="pt-28">
      <section className="mx-auto max-w-6xl px-5 pb-20 md:grid md:grid-cols-2 md:gap-16 md:px-8">
        <Reveal>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--teal)]">
              Contact
            </p>
            <h1 className="display mt-3 text-5xl md:text-6xl">
              We are here on clinic days.
            </h1>
            <p className="mt-5 text-lg text-[var(--ink-soft)]">
              Send a note for referrals, medical records requests, or general
              questions. Appointment requests are faster through the booking
              form.
            </p>

            <div className="mt-10 space-y-8">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--brass)]">
                  Address
                </p>
                <p className="mt-2 text-[var(--ink-soft)]">
                  {clinic.address.line1}
                  <br />
                  {clinic.address.line2}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--brass)]">
                  Reach us
                </p>
                <p className="mt-2 text-[var(--ink-soft)]">{clinic.phone}</p>
                <p className="text-[var(--ink-soft)]">{clinic.email}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--brass)]">
                  Hours
                </p>
                <ul className="mt-2 space-y-1 text-[var(--ink-soft)]">
                  {clinic.hours.map((h) => (
                    <li key={h.day}>
                      {h.day}: {h.time}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-12 rounded-2xl border border-[var(--line)] bg-white p-6 shadow-[0_20px_60px_rgba(10,27,51,0.08)] md:mt-0 md:p-8">
            <ContactForm />
          </div>
        </Reveal>
      </section>
    </div>
  );
}
