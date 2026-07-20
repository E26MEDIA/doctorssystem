import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { articles } from "@/lib/clinic";

const bodies: Record<string, string[]> = {
  "reading-your-bloodwork": [
    "Lab reports look dense on purpose. The useful move is to stop scanning every number and start with three anchors: inflammation (CRP), sugar control (HbA1c or fasting glucose), and lipids (LDL, HDL, triglycerides).",
    "Ask what changed since your last draw. A single abnormal value is a conversation starter, not a verdict. Trends across six to twelve months matter more than one dramatic outlier after a stressful week.",
    "Bring context: sleep, alcohol, infection, and medications all shift numbers. At Meridian, we review labs with that story attached — so the plan fits your week, not a generic chart.",
  ],
  "sleep-before-supplements": [
    "Supplements can help when a deficiency is real. They rarely outrun four hours of fragmented sleep, late caffeine, or a bedroom that never gets dark.",
    "Start with schedule consistency, morning light, and a wind-down that doesn’t involve a glowing screen. Fix those for two weeks before stacking magnesium, ashwagandha, or another bottle.",
    "If sleep still fails after basics, we look for apnea risk, thyroid issues, mood, and medications — not another wellness product.",
  ],
  "midlife-checkups": [
    "Ages 40–55 are when prevention stops being theoretical. Blood pressure, lipids, glucose, cancer screening, bone density conversations, and vaccination catch-up all belong on one page.",
    "For women, perimenopause symptoms deserve medical attention, not dismissal. For everyone, fitness capacity and waist circumference predict risk as clearly as many lab panels.",
    "An executive-style checkup at Meridian packages these into one visit with a written plan — so you’re not collecting fragments across five different offices.",
  ],
};

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) return { title: "Note" };
  return { title: article.title, description: article.excerpt };
}

export default async function JournalArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) notFound();

  const paragraphs = bodies[slug] ?? [article.excerpt];

  return (
    <article className="mx-auto max-w-3xl px-5 pb-24 pt-32 md:px-8">
      <Link
        href="/journal"
        className="text-sm text-[var(--teal)] underline-offset-4 hover:underline"
      >
        ← Journal
      </Link>
      <p className="mt-8 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
        {article.date} · {article.readTime}
      </p>
      <h1 className="display mt-4 text-4xl md:text-5xl">{article.title}</h1>
      <div className="prose-clinic mt-10 text-lg leading-relaxed text-[var(--ink-soft)]">
        {paragraphs.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
      </div>
    </article>
  );
}
