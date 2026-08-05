import { testimonials } from "@/lib/clinic";

export function TestimonialsSection() {
  const items = [...testimonials, ...testimonials];

  return (
    <section className="section-pad">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <h2 className="display text-4xl md:text-5xl">Patient voices</h2>

        {/* Mobile: slow horizontal scroll */}
        <div className="testimonial-marquee mt-10 md:hidden">
          <div className="testimonial-track">
            {items.map((t, i) => (
              <blockquote
                key={`${t.name}-${i}`}
                className="testimonial-card shrink-0"
              >
                <p className="text-base leading-relaxed text-[var(--ink-soft)]">
                  “{t.quote}”
                </p>
                <footer className="mt-4">
                  <p className="font-medium text-[var(--deep)]">{t.name}</p>
                  <p className="text-sm text-[var(--muted)]">{t.detail}</p>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>

        {/* Desktop: static grid */}
        <div className="mt-12 hidden gap-10 md:grid md:grid-cols-3">
          {testimonials.map((t) => (
            <blockquote key={t.name}>
              <p className="text-lg leading-relaxed text-[var(--ink-soft)]">
                “{t.quote}”
              </p>
              <footer className="mt-6">
                <p className="font-medium text-[var(--deep)]">{t.name}</p>
                <p className="text-sm text-[var(--muted)]">{t.detail}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
