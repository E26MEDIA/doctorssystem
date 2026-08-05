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

  const consultations = services.filter((s) =>
    ["clinic-consultation", "virtual-consultation"].includes(s.slug),
  );
  const procedures = services.filter(
    (s) =>
      !["clinic-consultation", "virtual-consultation"].includes(s.slug),
  );

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
            Book a consultation first — clinic or virtual. Procedure planning
            follows after clinical review with {clinic.doctor}.
          </p>
        </Reveal>
      </section>

      {consultations.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pb-16 md:px-8">
          <h2 className="display text-3xl text-[var(--deep)]">Consultations</h2>
          <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
            Choose clinic or virtual when you book. Both start from the same
            booking form.
          </p>
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {consultations.map((service, i) => (
              <Reveal key={service.slug} delay={i * 60}>
                <article className="flex h-full flex-col rounded-[1.4rem] border border-[var(--line)] bg-white/80 p-7 md:p-8">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="display text-3xl text-[var(--deep)]">
                      {service.title}
                    </h3>
                    <span className="shrink-0 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                      {service.duration}
                    </span>
                  </div>
                  <p className="mt-4 text-[var(--ink-soft)] leading-relaxed">
                    {service.summary}
                  </p>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-[var(--muted)]">
                    {service.details}
                  </p>
                  <Link href="/#book" className="btn-primary mt-7 self-start">
                    Book consultation
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {procedures.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pb-24 md:px-8">
          <h2 className="display text-3xl text-[var(--deep)]">
            Surgical pathways
          </h2>
          <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
            These procedures are planned after a consultation. Book a visit to
            discuss whether surgery is right for you.
          </p>
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            {procedures.map((service, i) => (
              <Reveal key={service.slug} delay={i * 60}>
                <article className="flex h-full flex-col rounded-[1.4rem] border border-[var(--line)] bg-white/80 p-7 md:p-8">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="display text-3xl text-[var(--deep)]">
                      {service.title}
                    </h3>
                    <span className="shrink-0 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                      Procedure
                    </span>
                  </div>
                  <p className="mt-4 text-[var(--ink-soft)] leading-relaxed">
                    {service.summary}
                  </p>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-[var(--muted)]">
                    {service.details}
                  </p>
                  <Link href="/#book" className="btn-primary mt-7 self-start">
                    Book consultation
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
