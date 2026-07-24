import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { getActiveServices, getClinicConfig } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const clinic = await getClinicConfig();
  return {
    title: "Services",
    description: `Consultations and surgical care with ${clinic.doctor}.`,
  };
}

export default async function ServicesPage() {
  const [clinic, services] = await Promise.all([
    getClinicConfig(),
    getActiveServices(),
  ]);

  return (
    <div className="pt-28">
      <section className="mx-auto max-w-6xl px-5 pb-12 md:px-8">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--teal)]">
            Services
          </p>
          <h1 className="display mt-3 max-w-3xl text-5xl md:text-6xl">
            Consultations & surgical pathways
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-[var(--ink-soft)]">
            Start with a clinic or virtual consultation. Procedure planning
            follows after clinical review with {clinic.doctor}.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24 md:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          {services.map((service, i) => (
            <Reveal key={service.slug} delay={i * 60}>
              <article className="h-full rounded-[1.4rem] border border-[var(--line)] bg-white/80 p-7 md:p-8">
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="display text-3xl text-[var(--deep)]">
                    {service.title}
                  </h2>
                  <span className="shrink-0 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                    {service.duration}
                  </span>
                </div>
                <p className="mt-4 text-[var(--ink-soft)] leading-relaxed">
                  {service.summary}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
                  {service.details}
                </p>
                {(service.slug === "clinic-consultation" ||
                  service.slug === "virtual-consultation") && (
                  <Link href="/#book" className="btn-primary mt-7">
                    Book {service.title.toLowerCase()}
                  </Link>
                )}
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
