import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { testimonials } from "@/lib/clinic";
import { getActiveServices, getClinicConfig } from "@/lib/settings";

export default async function HomePage() {
  const [clinic, services] = await Promise.all([
    getClinicConfig(),
    getActiveServices(),
  ]);

  return (
    <>
      <section className="relative min-h-[100svh] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/hero.jpg"
            alt="Calm clinical consultation space with natural light"
            fill
            priority
            className="hero-media object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[rgba(7,21,38,0.88)] via-[rgba(10,27,51,0.62)] to-[rgba(10,27,51,0.25)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(7,21,38,0.7)] via-transparent to-[rgba(18,184,134,0.08)]" />
        </div>

        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl items-end px-5 pb-20 pt-36 md:items-center md:px-8 md:pb-24">
          <div className="hero-copy max-w-2xl text-white">
            <p className="text-sm uppercase tracking-[0.28em] text-[var(--brass)]">
              {clinic.name}
            </p>
            <h1 className="display mt-4 text-5xl text-white md:text-7xl">
              Medicine that
              <br />
              slows down with you.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/80">
              {clinic.doctor}, {clinic.credentials} — preventive and internal
              medicine in Indiranagar, Bengaluru.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/book"
                className="btn-primary !bg-[var(--brass)] !text-[var(--navy)] !shadow-[0_12px_32px_rgba(34,197,94,0.35)] hover:!bg-white hover:!text-[var(--navy)]"
              >
                Request a visit
              </Link>
              <Link
                href="/about"
                className="btn-ghost !border-white/40 !text-white hover:!border-[var(--brass)] hover:!bg-white/10 hover:!text-white"
              >
                Meet {clinic.doctor.split(" ").slice(-1)[0]}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <Reveal>
            <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-end">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--teal)]">
                  The practice
                </p>
                <h2 className="display mt-3 text-4xl text-[var(--ink)] md:text-5xl">
                  A quieter kind of clinic.
                </h2>
                <div className="accent-line mt-5 h-0.5 w-24 bg-[var(--brass)]" />
              </div>
              <p className="text-lg leading-relaxed text-[var(--ink-soft)]">
                Meridian Health is built for people who want more than a rushed
                prescription — clear explanations, measured follow-up, and a plan
                that respects how you actually live.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Unhurried visits",
                body: "Appointments that start on time and leave room for the question you almost didn’t ask.",
              },
              {
                title: "Prevention first",
                body: "Screening, labs, and lifestyle guidance before problems need dramatic intervention.",
              },
              {
                title: "Continuity",
                body: "One physician who knows your history — not a revolving door of unfamiliar faces.",
              },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 100}>
                <div className="border-t border-[var(--line)] pt-6">
                  <h3 className="display text-2xl text-[var(--forest)]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-[var(--ink-soft)] leading-relaxed">
                    {item.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-[var(--navy)] text-white">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--brass)]">
                  Care offerings
                </p>
                <h2 className="display mt-3 text-4xl md:text-5xl">
                  How we can help
                </h2>
              </div>
              <Link
                href="/services"
                className="text-sm text-[var(--brass)] underline-offset-4 hover:underline"
              >
                View all services →
              </Link>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-x-10 gap-y-12 md:grid-cols-2">
            {services.slice(0, 4).map((service, i) => (
              <Reveal key={service.slug} delay={i * 80}>
                <article className="group border-l-2 border-[var(--brass)]/40 pl-5 transition-colors hover:border-[var(--brass)]">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="display text-3xl transition-colors group-hover:text-[var(--brass)]">
                      {service.title}
                    </h3>
                    <span className="text-xs uppercase tracking-[0.16em] text-white/45">
                      {service.duration}
                    </span>
                  </div>
                  <p className="mt-3 max-w-md text-white/70 leading-relaxed">
                    {service.summary}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 md:grid-cols-2 md:items-center md:px-8">
          <Reveal>
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image
                src="/images/doctor.jpg"
                alt={`${clinic.doctor} in clinical setting`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--teal)]">
                Physician
              </p>
              <h2 className="display mt-3 text-4xl md:text-5xl">
                {clinic.doctor}
              </h2>
              <p className="mt-2 text-[var(--muted)]">{clinic.credentials}</p>
              <p className="mt-6 text-lg leading-relaxed text-[var(--ink-soft)]">
                Trained in internal medicine with a focus on prevention and
                metabolic health, Dr. Rao built Meridian for patients who want
                clarity without the noise of a hospital waiting room.
              </p>
              <Link href="/about" className="btn-ghost mt-8">
                Full biography
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section-pad border-y border-[var(--line)] bg-white/40">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <Reveal>
            <h2 className="display text-4xl md:text-5xl">Patient voices</h2>
          </Reveal>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 100}>
                <blockquote>
                  <p className="text-lg leading-relaxed text-[var(--ink-soft)]">
                    “{t.quote}”
                  </p>
                  <footer className="mt-6">
                    <p className="font-medium text-[var(--forest)]">{t.name}</p>
                    <p className="text-sm text-[var(--muted)]">{t.detail}</p>
                  </footer>
                </blockquote>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <Reveal>
          <div className="mx-auto max-w-4xl px-5 text-center md:px-8">
            <h2 className="display text-4xl md:text-6xl">
              Ready for a clearer next step?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-[var(--ink-soft)]">
              Request a visit online. The team confirms your slot within one
              business day.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/book" className="btn-primary">
                Book appointment
              </Link>
              <Link href="/contact" className="btn-ghost">
                Ask a question
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
