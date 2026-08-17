"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clinic } from "@/lib/clinic";

type Brand = { name: string; doctor: string };

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/gallery", label: "Gallery" },
  { href: "/journal", label: "Journal" },
  { href: "/contact", label: "Contact" },
];

export function Header(_props: { brand: Brand }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [overHero, setOverHero] = useState(pathname === "/");
  const solid = !overHero || open;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (pathname !== "/") {
      setOverHero(false);
      return;
    }

    const hero = document.getElementById("hero");
    if (!hero) {
      setOverHero(window.scrollY < 40);
      return;
    }

    const sync = () => {
      const rect = hero.getBoundingClientRect();
      // Stay transparent only while the dark hero still fills under the menu
      setOverHero(rect.bottom > 96);
    };

    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("hashchange", sync);
    window.addEventListener("resize", sync);

    const observer = new IntersectionObserver(() => sync(), {
      threshold: [0, 0.01, 0.1, 0.25, 0.5, 1],
    });
    observer.observe(hero);

    // Hash jumps (#book) can land after first paint
    const t1 = window.setTimeout(sync, 50);
    const t2 = window.setTimeout(sync, 250);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", sync);
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("resize", sync);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [pathname]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[100] transition-all duration-300 ${
        solid
          ? "border-b border-[var(--line)] bg-white shadow-[0_8px_30px_rgba(6,51,44,0.08)]"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
        <Link href="/" className="group flex flex-col leading-none">
          <span
            className={`font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight transition-colors ${
              solid
                ? "text-[var(--deep)] group-hover:text-[var(--teal)]"
                : "text-white group-hover:text-[var(--teal-bright)]"
            }`}
          >
            {clinic.doctor}
          </span>
          <span
            className={`mt-1 text-[11px] uppercase tracking-[0.18em] ${
              solid ? "text-[var(--muted)]" : "text-white/65"
            }`}
          >
            Surgical Gastroenterology
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm tracking-wide transition-colors ${
                  solid
                    ? active
                      ? "text-[var(--teal)]"
                      : "text-[var(--ink-soft)] hover:text-[var(--teal)]"
                    : active
                      ? "text-[var(--teal-bright)]"
                      : "text-white/80 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          aria-label="Toggle menu"
          className="relative z-50 flex h-10 w-10 items-center justify-center md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          <span
            className={`absolute h-0.5 w-5 transition ${
              solid ? "bg-[var(--ink)]" : "bg-white"
            } ${open ? "translate-y-0 rotate-45" : "-translate-y-1.5"}`}
          />
          <span
            className={`absolute h-0.5 w-5 transition ${
              solid ? "bg-[var(--ink)]" : "bg-white"
            } ${open ? "opacity-0" : "opacity-100"}`}
          />
          <span
            className={`absolute h-0.5 w-5 transition ${
              solid ? "bg-[var(--ink)]" : "bg-white"
            } ${open ? "translate-y-0 -rotate-45" : "translate-y-1.5"}`}
          />
        </button>
      </div>

      <div
        className={`md:hidden overflow-hidden border-b border-[var(--line)] bg-white transition-all duration-400 ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="flex flex-col gap-1 px-5 py-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="py-3 text-lg text-[var(--ink)]"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/services" className="btn-primary mt-2 text-center">
            View services
          </Link>
        </nav>
      </div>
    </header>
  );
}
