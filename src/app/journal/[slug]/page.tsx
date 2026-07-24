import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/Reveal";
import { articles } from "@/lib/clinic";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  if (!article) notFound();

  return (
    <div className="pt-28">
      <article className="mx-auto max-w-3xl px-5 pb-24 md:px-8">
        <Reveal>
          <Link
            href="/journal"
            className="text-sm font-medium text-[var(--teal)] underline-offset-4 hover:underline"
          >
            ← Back to journal
          </Link>
          <p className="mt-8 text-xs uppercase tracking-[0.18em] text-[var(--teal)]">
            {article.category}
          </p>
          <h1 className="display mt-3 text-4xl md:text-5xl">{article.title}</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">
            {new Date(article.publishedAt).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}{" "}
            · {article.readTime}
          </p>
          <div className="prose-clinic mt-10 text-lg leading-relaxed text-[var(--ink-soft)]">
            {article.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </Reveal>
      </article>
    </div>
  );
}
