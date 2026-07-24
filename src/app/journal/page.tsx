import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { articles } from "@/lib/clinic";

export const metadata: Metadata = {
  title: "Journal",
  description: "Patient guidance on gut health and surgical care.",
};

export default function JournalPage() {
  return (
    <div className="pt-28">
      <section className="mx-auto max-w-6xl px-5 pb-12 md:px-8">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--teal)]">
            Patient journal
          </p>
          <h1 className="display mt-3 max-w-3xl text-5xl md:text-6xl">
            Clear notes on gut and surgical care
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-[var(--ink-soft)]">
            Practical guidance from Dr. Honnani&apos;s practice.
          </p>
        </Reveal>
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-24 md:px-8">
        <div className="grid gap-6">
          {articles.map((article, i) => (
            <Reveal key={article.slug} delay={i * 60}>
              <article className="rounded-[1.25rem] border border-[var(--line)] bg-white/80 p-6 md:p-8">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--teal)]">
                  {article.category}
                </p>
                <h2 className="display mt-2 text-3xl text-[var(--ink)] md:text-4xl">
                  {article.title}
                </h2>
                <p className="mt-3 max-w-3xl text-[var(--ink-soft)]">{article.excerpt}</p>
                <Link
                  href={`/journal/${article.slug}`}
                  className="mt-5 inline-flex text-sm font-medium text-[var(--teal)] underline-offset-4 hover:underline"
                >
                  Read article
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
