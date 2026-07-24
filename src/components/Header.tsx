"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Brand = { name: string; doctor: string };

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/gallery", label: "Gallery" },
  { href: "/journal", label: "Journal" },
  { href: "/contact", label: "Contact" },
];

export function Header({ brand }: { brand: Brand }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const overHero = pathname === "/" && !scrolled && !open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled || open
          ? "border-b border-[var(--line)] bg-white/95 backdrop-blur-md shadow-[0_8px_30px_rgba(6,51,44,0.06)]"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
        <Link href="/" className="group flex flex-col leading-none">
          <span
            className={`font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight transition-colors ${
              overHero
                ? "text-white group-hover:text-[var(--teal-bright)]"
                : "text-[var(--deep)] group-hover:text-[var(--teal)]"
            }`}
          >
            {brand.doctor.replace(/^Dr\.\s*/, "Dr. ")}
          </span>
          <span
            className={`mt-1 text-[11px] uppercase tracking-[0.18em] ${
              overHero ? "text-white/65" : "text-[var(--muted)]"
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
                  overHero
                    ? active
                      ? "text-[var(--teal-bright)]"
                      : "text-white/80 hover:text-white"
                    : active
                      ? "text-[var(--teal)]"
                      : "text-[var(--ink-soft)] hover:text-[var(--teal)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/#book"
            className={`btn-primary !px-5 !py-2.5 text-sm ${
              overHero ? "!bg-[var(--teal-bright)] !text-[var(--deep)]" : ""
            }`}
          >
            Book visit
          </Link>
        </nav>

        <button
          type="button"
          aria-label="Toggle menu"
          className="relative z-50 flex h-10 w-10 items-center justify-center md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          <span
            className={`absolute h-0.5 w-5 transition ${
              overHero && !open ? "bg-white" : "bg-[var(--ink)]"
            } ${open ? "translate-y-0 rotate-45" : "-translate-y-1.5"}`}
          />
          <span
            className={`absolute h-0.5 w-5 transition ${
              overHero && !open ? "bg-white" : "bg-[var(--ink)]"
            } ${open ? "opacity-0" : "opacity-100"}`}
          />
          <span
            className={`absolute h-0.5 w-5 transition ${
              overHero && !open ? "bg-white" : "bg-[var(--ink)]"
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
          <Link href="/#book" className="btn-primary mt-2 text-center">
            Book visit
          </Link>
        </nav>
      </div>
    </header>
  );
}
