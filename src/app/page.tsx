import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { doctorProfile, testimonials } from "@/lib/clinic";
import { getActiveServices, getClinicConfig } from "@/lib/settings";

export default async function HomePage() {
  const [clinic, services] = await Promise.all([
    getClinicConfig(),
    getActiveServices(),
  ]);

  const consultServices = services.filter((s) =>
    ["clinic-consultation", "virtual-consultation"].includes(s.slug),
  );

  return (
    <>
      <section className="relative min-h-[100svh] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/hero.jpg"
            alt="Surgical care and consultation environment"
            fill
            priority
            className="hero-media object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[rgba(6,51,44,0.92)] via-[rgba(6,51,44,0.72)] to-[rgba(6,51,44,0.28)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(6,51,44,0.75)] via-transparent to-transparent" />
        </div>

        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl items-end px-5 pb-20 pt-36 md:items-center md:px-8 md:pb-24">
          <div className="hero-copy max-w-2xl text-white">
            <p className="text-sm uppercase tracking-[0.28em] text-[var(--teal-bright)]">
              {clinic.doctor}
            </p>
            <h1 className="display mt-4 text-5xl text-white md:text-7xl">
              Surgical GI care,
              <br />
              clearly guided.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/80">
              {clinic.credentials}. Visiting Consultant Surgical
              Gastroenterologist at Yenepoya Specialty Hospital, Mangaluru.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/book"
                className="btn-primary !bg-[var(--teal-bright)] !text-[var(--deep)] !shadow-[0_12px_32px_rgba(20,184,166,0.35)] hover:!bg-white"
              >
                Book consultation
              </Link>
              <Link
                href="/about"
                className="btn-ghost !border-white/35 !text-white hover:!border-[var(--teal-bright)] hover:!bg-white/10 hover:!text-white"
              >
                About {doctorProfile.shortName}
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
                  How to consult
                </p>
                <h2 className="display mt-3 text-4xl text-[var(--ink)] md:text-5xl">
                  Clinic visit or virtual Meet — your choice.
                </h2>
                <div className="accent-line mt-5 h-0.5 w-24 bg-[var(--teal-bright)]" />
              </div>
              <p className="text-lg leading-relaxed text-[var(--ink-soft)]">
                Pick an open slot from the doctor’s weekly schedule. Available
                slots confirm instantly — no waiting for approval. Virtual
                visits include a Google Meet link by email.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-8 md:grid-cols-2">
            {(consultServices.length
              ? consultServices
              : [
                  {
                    slug: "clinic-consultation",
                    title: "Clinic Consultation",
                    summary:
                      "In-person visit for assessment, second opinion, and surgical planning.",
                    duration: "30–45 min",
                  },
                  {
                    slug: "virtual-consultation",
                    title: "Virtual Consultation",
                    summary:
                      "Video visit from home with a Google Meet link sent on booking.",
                    duration: "20–30 min",
                  },
                ]
            ).map((item, i) => (
              <Reveal key={item.slug} delay={i * 100}>
                <article className="relative overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-8">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--teal)]">
                    {item.duration}
                  </p>
                  <h3 className="display mt-3 text-3xl text-[var(--deep)]">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-[var(--ink-soft)] leading-relaxed">
                    {item.summary}
                  </p>
                  <Link href="/book" className="btn-primary mt-8">
                    Book this visit
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-[var(--deep)] text-white">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--teal-bright)]">
                  Expertise
                </p>
                <h2 className="display mt-3 text-4xl md:text-5xl">
                  Areas of surgical focus
                </h2>
              </div>
              <Link
                href="/services"
                className="text-sm text-[var(--teal-bright)] underline-offset-4 hover:underline"
              >
                View all services →
              </Link>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-x-10 gap-y-8 md:grid-cols-2">
            {doctorProfile.expertise.slice(0, 6).map((item, i) => (
              <Reveal key={item} delay={i * 60}>
                <div className="border-l-2 border-[var(--teal-bright)]/40 pl-5">
                  <p className="text-lg text-white/90">{item}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 md:grid-cols-2 md:items-center md:px-8">
          <Reveal>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem]">
              <Image
                src="/images/doctor.jpg"
                alt={clinic.doctor}
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
              <p className="mt-2 text-[var(--muted)]">{doctorProfile.role}</p>
              <p className="mt-6 text-lg leading-relaxed text-[var(--ink-soft)]">
                {doctorProfile.bio[0]}
              </p>
              <Link href="/about" className="btn-ghost mt-8">
                Education & experience
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section-pad border-y border-[var(--line)] bg-white/50">
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
                    <p className="font-medium text-[var(--deep)]">{t.name}</p>
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
              Ready to book an open slot?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-[var(--ink-soft)]">
              Choose clinic or virtual consultation. If the slot is free, your
              booking is confirmed immediately.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/book" className="btn-primary">
                Book now
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
