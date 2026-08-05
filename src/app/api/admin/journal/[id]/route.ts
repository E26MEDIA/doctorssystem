import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  assertSameOrigin,
  forbiddenOrigin,
  readJsonLimited,
} from "@/lib/security";
import { journalArticleSchema } from "@/lib/journalSchema";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, ctx: Ctx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!assertSameOrigin(request)) return forbiddenOrigin();

  const { id } = await ctx.params;
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
    const article = await prisma.journalArticle.update({
      where: { id },
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
      { error: "Could not update article" },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!assertSameOrigin(_request)) return forbiddenOrigin();

  const { id } = await ctx.params;
  await prisma.journalArticle.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
