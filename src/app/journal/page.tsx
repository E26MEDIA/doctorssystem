import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { articles } from "@/lib/clinic";

export const metadata: Metadata = {
  title: "Journal",
  description: "Health notes and practical guidance from Meridian Health.",
};

export default function JournalPage() {
  return (
    <div className="pt-28">
      <section className="mx-auto max-w-6xl px-5 pb-16 md:px-8">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--teal)]">
            Journal
          </p>
          <h1 className="display mt-3 max-w-3xl text-5xl md:text-6xl">
            Short notes for longer health.
          </h1>
        </Reveal>

        <div className="mt-14 space-y-0">
          {articles.map((article, i) => (
            <Reveal key={article.slug} delay={i * 70}>
              <article className="border-t border-[var(--line)] py-10">
                <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  <time dateTime={article.date}>{article.date}</time>
                  <span>·</span>
                  <span>{article.readTime}</span>
                </div>
                <h2 className="display mt-3 text-3xl md:text-4xl">
                  <Link
                    href={`/journal/${article.slug}`}
                    className="transition-colors hover:text-[var(--teal)]"
                  >
                    {article.title}
                  </Link>
                </h2>
                <p className="mt-3 max-w-2xl text-lg text-[var(--ink-soft)]">
                  {article.excerpt}
                </p>
                <Link
                  href={`/journal/${article.slug}`}
                  className="mt-5 inline-block text-sm text-[var(--teal)] underline-offset-4 hover:underline"
                >
                  Read note →
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
