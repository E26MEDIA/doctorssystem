import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { getActiveJournalArticles } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Journal",
  description: "Patient guidance on gut health and surgical care.",
};

export default async function JournalPage() {
  const articles = await getActiveJournalArticles();

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
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, i) => (
            <Reveal key={article.slug} delay={i * 60}>
              <Link
                href={`/journal/${article.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-[var(--line)] bg-white shadow-[0_12px_40px_rgba(6,51,44,0.06)] transition hover:border-[var(--teal)]/40"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-[var(--sand)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5 md:p-6">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--teal)]">
                    {article.category}
                  </p>
                  <h2 className="display mt-2 text-2xl text-[var(--ink)] md:text-3xl">
                    {article.title}
                  </h2>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--ink-soft)]">
                    {article.excerpt}
                  </p>
                  <span className="mt-4 text-sm font-medium text-[var(--teal)]">
                    Read article →
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
