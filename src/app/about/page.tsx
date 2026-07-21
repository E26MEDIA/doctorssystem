import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { getClinicConfig } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const clinic = await getClinicConfig();
  return {
    title: "About",
    description: `Meet ${clinic.doctor}, founder of ${clinic.name}.`,
  };
}

export default async function AboutPage() {
  const clinic = await getClinicConfig();

  return (
    <div className="pt-28">
      <section className="mx-auto max-w-6xl px-5 pb-16 md:px-8">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--teal)]">
            About
          </p>
          <h1 className="display mt-3 max-w-3xl text-5xl md:text-6xl">
            Care shaped by curiosity, not convenience.
          </h1>
        </Reveal>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 md:grid-cols-2 md:px-8">
        <Reveal>
          <div className="relative aspect-[4/5] overflow-hidden">
            <Image
              src="/images/about.jpg"
              alt={clinic.doctor}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div className="prose-clinic self-center text-lg leading-relaxed text-[var(--ink-soft)]">
            <p>
              {clinic.doctor} is an internal medicine physician focused on
              prevention, metabolic health, and the kind of follow-through that
              rarely fits into a seven-minute slot.
            </p>
            <p>
              After years in high-volume hospital medicine, she founded{" "}
              {clinic.name} to practice differently: fewer patients, deeper
              visits, and care plans written in plain language.
            </p>
            <p>
              Patients come for annual physicals, chronic disease management,
              midlife health, and second opinions — and stay for the continuity.
            </p>
            <Link href="/book" className="btn-primary mt-8">
              Book with {clinic.doctor.replace(/^Dr\.\s*/, "Dr. ")}
            </Link>
          </div>
        </Reveal>
      </section>

      <section className="border-y border-[var(--line)] bg-white/50">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-3 md:px-8">
          {[
            {
              label: "Training",
              items: [
                clinic.credentials,
                "Residency: tertiary care hospital medicine",
                "Ongoing CME in cardiometabolic health",
              ],
            },
            {
              label: "Focus areas",
              items: [
                "Hypertension & diabetes",
                "Preventive screening",
                "Women’s midlife health",
                "Executive wellness",
              ],
            },
            {
              label: "Philosophy",
              items: [
                "Listen first, test second",
                "Explain every recommendation",
                "Partner with specialists when needed",
                "Measure what matters to you",
              ],
            },
          ].map((col, i) => (
            <Reveal key={col.label} delay={i * 80}>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--brass)]">
                  {col.label}
                </p>
                <ul className="mt-5 space-y-3 text-[var(--ink-soft)]">
                  {col.items.map((item) => (
                    <li key={item} className="border-b border-[var(--line)] pb-3">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section-pad">
        <Reveal>
          <div className="mx-auto max-w-3xl px-5 text-center md:px-8">
            <h2 className="display text-4xl md:text-5xl">
              The clinic you’ll return to.
            </h2>
            <p className="mt-5 text-lg text-[var(--ink-soft)]">
              {clinic.address.line1}, {clinic.address.line2} — calm consulting
              rooms, coordinated labs, and video follow-ups when travel isn’t
              necessary.
            </p>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
