import Link from "next/link";
import type { ClinicConfig } from "@/lib/settings";

export function Footer({ clinic }: { clinic: ClinicConfig }) {
  return (
    <footer className="mt-auto border-t border-[var(--line)] bg-[var(--deep)] text-[rgba(232,241,237,0.88)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-4 md:px-8">
        <div className="md:col-span-1">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--teal-bright)]">
            Surgical gastroenterology
          </p>
          <h3 className="display mt-3 text-2xl text-white">{clinic.doctor}</h3>
          <p className="mt-3 max-w-[34ch] text-sm leading-relaxed text-white/65">
            {clinic.tagline}
          </p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-white">Visit</h4>
          <p className="mt-3 text-sm leading-8 text-white/65">
            {clinic.address.line1}
            <br />
            {clinic.address.line2}
            <br />
            {clinic.hours.map((h) => (
              <span key={h.day}>
                {h.day}: {h.time}
                <br />
              </span>
            ))}
          </p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-white">Contact</h4>
          <p className="mt-3 text-sm leading-8 text-white/65">
            <a href={`tel:${clinic.phone}`} className="hover:text-[var(--teal-bright)]">
              {clinic.phone}
            </a>
            <br />
            <a href={`mailto:${clinic.email}`} className="hover:text-[var(--teal-bright)]">
              {clinic.email}
            </a>
            <br />
            <a
              href={clinic.social.instagram}
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--teal-bright)]"
            >
              Instagram @dr.honnani
            </a>
            <br />
            <a
              href={clinic.social.linkedin}
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--teal-bright)]"
            >
              Yenepoya hospital profile
            </a>
          </p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-white">Pages</h4>
          <div className="mt-3 grid gap-2 text-sm text-white/65">
            <Link href="/about" className="hover:text-[var(--teal-bright)]">
              About
            </Link>
            <Link href="/services" className="hover:text-[var(--teal-bright)]">
              Services
            </Link>
            <Link href="/gallery" className="hover:text-[var(--teal-bright)]">
              Gallery
            </Link>
            <Link href="/#book" className="hover:text-[var(--teal-bright)]">
              Book appointment
            </Link>
            <Link href="/contact" className="hover:text-[var(--teal-bright)]">
              Contact
            </Link>
            <Link href="/admin" className="hover:text-[var(--teal-bright)]">
              Admin
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between md:px-8">
          <span>
            © {new Date().getFullYear()} {clinic.doctor}. All rights reserved.
          </span>
          <span>Clinic · Virtual · Instant slot confirmation</span>
        </div>
      </div>
    </footer>
  );
}
