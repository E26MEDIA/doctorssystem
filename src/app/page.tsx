import Image from "next/image";
import Link from "next/link";
import { AppointmentForm } from "@/components/AppointmentForm";
import { GallerySection } from "@/components/GallerySection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { clinic as clinicInfo, doctorProfile, whatsappHref } from "@/lib/clinic";
import {
  getActiveJournalArticles,
  getActiveServices,
  getClinicConfig,
} from "@/lib/settings";

export default async function HomePage() {
  const [clinic, services, articles] = await Promise.all([
    getClinicConfig(),
    getActiveServices(),
    getActiveJournalArticles(),
  ]);

  const consultServices = services.filter((s) =>
    ["clinic-consultation", "virtual-consultation"].includes(s.slug),
  );

  return (
    <>
      {/* 1. Hero */}
      <section id="hero" className="relative min-h-[100svh] overflow-hidden">
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
              {clinicInfo.doctor}
            </p>
            <h1 className="display mt-4 text-5xl text-white md:text-7xl">
              Surgical GI care,
              <br />
              clearly guided.
            </h1>
            <div className="mt-6 max-w-lg space-y-1 text-lg leading-relaxed text-white/80">
              {doctorProfile.intro.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/#book"
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

      {/* 2. Doctor details */}
      <section className="section-pad">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 md:grid-cols-2 md:items-center md:px-8">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem]">
            <Image
              src={doctorProfile.portrait}
              alt={clinicInfo.doctor}
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--teal)]">
              Physician
            </p>
            <h2 className="display mt-3 text-4xl md:text-5xl">{clinicInfo.doctor}</h2>
            <p className="mt-2 text-[var(--muted)]">{doctorProfile.role}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {doctorProfile.specialty}
            </p>
            <p className="mt-6 text-lg leading-relaxed text-[var(--ink-soft)]">
              {doctorProfile.bio[0]}
            </p>
            <p className="mt-4 text-lg leading-relaxed text-[var(--ink-soft)]">
              {doctorProfile.bio[1]}
            </p>
            <Link href="/about" className="btn-ghost mt-8">
              Education & experience
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Areas of working */}
      <section className="section-pad bg-[var(--deep)] text-white">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
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

          <div className="mt-12 grid gap-x-10 gap-y-8 md:grid-cols-2">
            {doctorProfile.expertise.map((item) => (
              <div
                key={item}
                className="border-l-2 border-[var(--teal-bright)]/40 pl-5"
              >
                <p className="text-lg text-white/90">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Gallery — photos first, then reels */}
      <section id="gallery" className="section-pad scroll-mt-28">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--teal)]">
                Gallery
              </p>
              <h2 className="display mt-3 text-4xl text-[var(--ink)] md:text-5xl">
                Photos & Instagram reels
              </h2>
            </div>
            <Link
              href="/gallery"
              className="text-sm font-medium text-[var(--teal)] underline-offset-4 hover:underline"
            >
              Full gallery →
            </Link>
          </div>
          <GallerySection compact showReels />
        </div>
      </section>

      {/* 5. Journal / articles */}
      <section className="section-pad border-y border-[var(--line)] bg-white/55">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--teal)]">
                Journal
              </p>
              <h2 className="display mt-3 text-4xl md:text-5xl">
                Articles & patient notes
              </h2>
            </div>
            <Link
              href="/journal"
              className="text-sm font-medium text-[var(--teal)] underline-offset-4 hover:underline"
            >
              All articles →
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {articles.slice(0, 3).map((article) => (
              <Link
                key={article.slug}
                href={`/journal/${article.slug}`}
                className="group overflow-hidden rounded-[1.25rem] border border-[var(--line)] bg-white/90 transition hover:border-[var(--teal)]/40"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-[var(--sand)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={article.imageUrl}
                    alt=""
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-6">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--teal)]">
                    {article.category}
                  </p>
                  <h3 className="display mt-2 text-2xl text-[var(--deep)]">
                    {article.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">
                    {article.excerpt}
                  </p>
                  <span className="mt-5 inline-flex text-sm font-medium text-[var(--teal)]">
                    Read article →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 6. How to consult + booking */}
      <section className="section-pad">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <h2 className="display text-4xl md:text-5xl">How to consult</h2>
          <p className="mt-4 max-w-2xl text-lg text-[var(--ink-soft)]">
            Clinic visit or virtual Meet. Open slots confirm instantly.
          </p>
          <div className="mt-10 grid gap-8 md:grid-cols-2">
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
                      "Video visit from home. Complete checkout to receive your Google Meet link.",
                    duration: "20–30 min",
                  },
                ]
            ).map((item) => (
              <article
                key={item.slug}
                className="rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-8"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--teal)]">
                  {item.duration}
                </p>
                <h3 className="display mt-3 text-3xl text-[var(--deep)]">
                  {item.title}
                </h3>
                <p className="mt-4 leading-relaxed text-[var(--ink-soft)]">
                  {item.summary}
                </p>
                <Link href="/#book" className="btn-primary mt-8">
                  Book this visit
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="book" className="section-pad scroll-mt-28 border-t border-[var(--line)] bg-white/50">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-[0.9fr_1.1fr] md:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--teal)]">
              Book on this page
            </p>
            <h2 className="display mt-3 text-4xl md:text-5xl">
              Clinic or virtual — pick an open slot
            </h2>
            <p className="mt-4 text-lg text-[var(--ink-soft)]">
              Choose clinic or virtual, pick an open slot, then confirm. Virtual
              visits continue to a secure checkout for the consultation fee.
            </p>
            <div className="mt-8 space-y-2 text-sm text-[var(--ink-soft)]">
              <p>
                <span className="text-[var(--muted)]">Phone:</span> {clinic.phone}
              </p>
              <p>
                <span className="text-[var(--muted)]">WhatsApp:</span>{" "}
                <a
                  href={whatsappHref()}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-[var(--teal)] underline-offset-4 hover:underline"
                >
                  63669 18181
                </a>
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
          <div className="rounded-[1.5rem] border border-[var(--line)] bg-white p-6 shadow-[0_24px_60px_rgba(6,51,44,0.08)] md:p-8">
            <AppointmentForm />
          </div>
        </div>
      </section>

      <TestimonialsSection />
    </>
  );
}
