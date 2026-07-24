import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { Reveal } from "@/components/Reveal";
import { getClinicConfig } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const clinic = await getClinicConfig();
  return {
    title: "Contact",
    description: `Contact ${clinic.doctor} and the care team.`,
  };
}

export default async function ContactPage() {
  const clinic = await getClinicConfig();

  return (
    <div className="pt-28">
      <section className="mx-auto grid max-w-6xl gap-12 px-5 pb-24 md:grid-cols-2 md:px-8">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--teal)]">
            Get in touch
          </p>
          <h1 className="display mt-3 text-5xl md:text-6xl">
            Reach {clinic.doctor.replace(/^Dr\.\s*/, "Dr. ")}&apos;s team
          </h1>
          <p className="mt-5 max-w-md text-lg text-[var(--ink-soft)]">
            For appointments, use{" "}
            <a href="/book" className="font-medium text-[var(--teal)] underline-offset-4 hover:underline">
              Book
            </a>
            . For general questions, send a message below.
          </p>
          <div className="mt-10 space-y-5 text-sm text-[var(--ink-soft)]">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Phone</p>
              <a href={`tel:${clinic.phone}`} className="mt-1 block text-base text-[var(--ink)]">
                {clinic.phone}
              </a>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Email</p>
              <a href={`mailto:${clinic.email}`} className="mt-1 block text-base text-[var(--ink)]">
                {clinic.email}
              </a>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Clinic</p>
              <p className="mt-1 text-base text-[var(--ink)]">
                {clinic.address.line1}
                <br />
                {clinic.address.line2}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Online</p>
              <a
                href={clinic.social.instagram}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block text-base text-[var(--teal)]"
              >
                Instagram @dr.honnani
              </a>
            </div>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div className="rounded-[1.5rem] border border-[var(--line)] bg-white p-6 shadow-[0_24px_60px_rgba(6,51,44,0.08)] md:p-8">
            <ContactForm />
          </div>
        </Reveal>
      </section>
    </div>
  );
}
