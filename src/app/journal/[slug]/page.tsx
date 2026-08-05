import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/Reveal";
import { getJournalArticleBySlug } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getJournalArticleBySlug(slug);
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
          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-[1.25rem] bg-[var(--sand)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.imageUrl}
              alt={article.title}
              className="h-full w-full object-cover"
            />
          </div>
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

          <div className="mt-10 space-y-8 text-lg leading-relaxed text-[var(--ink-soft)]">
            {article.blocks.map((block, index) => {
              if (block.type === "paragraph") {
                return <p key={`p-${index}`}>{block.text}</p>;
              }
              return (
                <figure key={`img-${index}`} className="my-2">
                  <div className="overflow-hidden rounded-[1.1rem] border border-[var(--line)] bg-[var(--sand)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={block.src}
                      alt={block.caption || article.title}
                      className="max-h-[28rem] w-full object-cover"
                    />
                  </div>
                  {block.caption ? (
                    <figcaption className="mt-3 text-center text-sm text-[var(--muted)]">
                      {block.caption}
                    </figcaption>
                  ) : null}
                </figure>
              );
            })}
          </div>

          <div className="mt-12 rounded-[1.25rem] border border-[var(--line)] bg-white/80 p-6">
            <p className="text-[var(--ink-soft)]">
              Ready to discuss your case with Dr. Honnani?
            </p>
            <Link href="/#book" className="btn-primary mt-4 inline-flex">
              Book consultation
            </Link>
          </div>
        </Reveal>
      </article>
    </div>
  );
}
