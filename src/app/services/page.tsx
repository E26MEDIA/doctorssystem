import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { getActiveServices, getClinicConfig } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const clinic = await getClinicConfig();
  return {
    title: "Services",
    description: `Care offerings at ${clinic.name}.`,
  };
}

export default async function ServicesPage() {
  const services = await getActiveServices();

  return (
    <div className="pt-28">
      <section className="mx-auto max-w-6xl px-5 pb-12 md:px-8">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--teal)]">
            Services
          </p>
          <h1 className="display mt-3 max-w-3xl text-5xl md:text-6xl">
            Clear offerings. Honest timelines.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-[var(--ink-soft)]">
            Every visit includes a written summary. Choose what you need — or
            start with an annual physical and we will map the rest.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24 md:px-8">
        <div className="space-y-0">
          {services.map((service, i) => (
            <Reveal key={service.slug} delay={i * 60}>
              <article
                id={service.slug}
                className="grid gap-4 border-t border-[var(--line)] py-10 md:grid-cols-[0.8fr_1.4fr_0.6fr] md:gap-8"
              >
                <h2 className="display text-3xl text-[var(--forest)] md:text-4xl">
                  {service.title}
                </h2>
                <div>
                  <p className="text-lg text-[var(--ink-soft)]">{service.summary}</p>
                  <p className="mt-4 text-[var(--muted)] leading-relaxed">
                    {service.details}
                  </p>
                </div>
                <div className="md:text-right">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--brass)]">
                    Duration
                  </p>
                  <p className="mt-2 text-[var(--ink)]">{service.duration}</p>
                  <Link
                    href="/book"
                    className="mt-6 inline-block text-sm text-[var(--teal)] underline-offset-4 hover:underline"
                  >
                    Book this →
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
