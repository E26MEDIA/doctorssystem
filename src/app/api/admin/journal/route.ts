import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureJournalArticles } from "@/lib/settings";
import { journalArticleSchema } from "@/lib/journalSchema";
import {
  assertSameOrigin,
  forbiddenOrigin,
  readJsonLimited,
} from "@/lib/security";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const articles = await ensureJournalArticles();
  return NextResponse.json({ articles });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!assertSameOrigin(request)) return forbiddenOrigin();

  const body = await readJsonLimited(request, 200_000);
  if (!body.ok) return body.response;

  const parsed = journalArticleSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid article", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const hasParagraph = parsed.data.blocks.some((b) => b.type === "paragraph");
  if (!hasParagraph) {
    return NextResponse.json(
      { error: "Add at least one text paragraph" },
      { status: 400 },
    );
  }

  try {
    const article = await prisma.journalArticle.create({
      data: {
        title: parsed.data.title,
        slug: parsed.data.slug,
        category: parsed.data.category,
        excerpt: parsed.data.excerpt,
        bodyJson: JSON.stringify(parsed.data.blocks),
        imageUrl: parsed.data.imageUrl,
        publishedAt: parsed.data.publishedAt,
        readTime: parsed.data.readTime,
        active: parsed.data.active,
        sortOrder: parsed.data.sortOrder,
      },
    });
    return NextResponse.json({ ok: true, article });
  } catch {
    return NextResponse.json(
      { error: "Could not create article (slug may already exist)" },
      { status: 409 },
    );
  }
}
