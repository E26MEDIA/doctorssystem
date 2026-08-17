import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { YoutubeSection } from "@/components/YoutubeSection";
import { clinic as clinicInfo, doctorProfile, youtubeChannel } from "@/lib/clinic";
import { getClinicConfig } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "About",
    description: `Meet ${clinicInfo.doctor}, Surgical Gastroenterologist.`,
  };
}

export default async function AboutPage() {
  const clinic = await getClinicConfig();

  return (
    <div className="pt-28">
      <section className="mx-auto max-w-6xl px-5 pb-16 md:px-8">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--teal)]">
          About
        </p>
        <h1 className="display mt-3 max-w-3xl text-5xl md:text-6xl">
          {clinicInfo.doctor}
        </h1>
        <div className="mt-4 max-w-2xl space-y-1 text-lg text-[var(--ink-soft)]">
          {doctorProfile.intro.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 md:grid-cols-2 md:px-8">
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
        <div className="prose-clinic self-center text-lg leading-relaxed text-[var(--ink-soft)]">
          {doctorProfile.bio.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <p className="mt-6">
            Practice affiliation: {doctorProfile.hospital}. Follow updates on{" "}
            <a
              href={clinic.social.instagram}
              className="text-[var(--teal)] underline-offset-4 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Instagram @dr.honnani
            </a>{" "}
            and{" "}
            <a
              href={youtubeChannel.url}
              className="text-[var(--teal)] underline-offset-4 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              YouTube {youtubeChannel.handle}
            </a>
            .
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/gallery" className="btn-primary">
              View gallery
            </Link>
            <Link href="/#book" className="btn-ghost">
              Book consultation
            </Link>
          </div>
        </div>
      </section>

      <YoutubeSection />

      <section className="border-y border-[var(--line)] bg-white/55 section-pad">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <h2 className="display text-4xl md:text-5xl">Education</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {doctorProfile.education.map((item) => (
              <div key={item.title} className="border-t border-[var(--line)] pt-6">
                <h3 className="display text-2xl text-[var(--deep)]">{item.title}</h3>
                <p className="mt-3 text-[var(--ink-soft)]">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <h2 className="display text-4xl md:text-5xl">Experience</h2>
          <div className="mt-10 space-y-8">
            {doctorProfile.experience.map((item) => (
              <div
                key={item.place}
                className="grid gap-2 border-l-2 border-[var(--teal)] pl-5 md:grid-cols-[1fr_1.4fr] md:gap-8"
              >
                <h3 className="display text-2xl text-[var(--deep)]">{item.place}</h3>
                <p className="text-lg text-[var(--ink-soft)]">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-[var(--deep)] text-white">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <h2 className="display text-4xl md:text-5xl">Clinical expertise</h2>
          <ul className="mt-10 grid gap-4 md:grid-cols-2">
            {doctorProfile.expertise.map((item) => (
              <li
                key={item}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-white/90"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
