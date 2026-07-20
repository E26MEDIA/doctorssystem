import Link from "next/link";
import type { ClinicConfig } from "@/lib/settings";

export function Footer({ clinic }: { clinic: ClinicConfig }) {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[var(--navy)] text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-3 md:px-8">
        <div>
          <p className="font-[family-name:var(--font-display)] text-3xl">
            {clinic.name}
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/70">
            {clinic.tagline}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--brass)]">
            Visit
          </p>
          <p className="mt-3 text-sm leading-relaxed text-white/80">
            {clinic.address.line1}
            <br />
            {clinic.address.line2}
          </p>
          <p className="mt-4 text-sm text-white/80">{clinic.phone}</p>
          <p className="text-sm text-white/80">{clinic.email}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--brass)]">
            Hours
          </p>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            {clinic.hours.map((h) => (
              <li key={h.day} className="flex justify-between gap-4">
                <span>{h.day}</span>
                <span>{h.time}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/book"
            className="mt-6 inline-block text-sm text-[var(--brass)] underline-offset-4 hover:underline"
          >
            Book an appointment →
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-5 text-center text-xs text-white/45 md:px-8">
        © {new Date().getFullYear()} {clinic.name}. Care by {clinic.doctor}.{" "}
        {clinic.emergencyNote}
      </div>
    </footer>
  );
}
