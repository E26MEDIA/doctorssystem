import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  assertSameOrigin,
  forbiddenOrigin,
  readJsonLimited,
} from "@/lib/security";

type Ctx = { params: Promise<{ id: string }> };

const articleSchema = z.object({
  title: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, hyphens"),
  category: z.string().trim().min(2).max(60),
  excerpt: z.string().trim().min(5).max(400),
  body: z.array(z.string().trim().min(1).max(2000)).min(1).max(40),
  imageUrl: z
    .string()
    .trim()
    .min(1)
    .max(300)
    .refine(
      (v) => v.startsWith("/") || /^https?:\/\//i.test(v),
      "Use a site path like /images/gallery-1.jpg or a full https URL",
    ),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  readTime: z.string().trim().min(2).max(20),
  active: z.boolean(),
  sortOrder: z.number().int().min(0).max(999),
});

export async function PUT(request: Request, ctx: Ctx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!assertSameOrigin(request)) return forbiddenOrigin();

  const { id } = await ctx.params;
  const body = await readJsonLimited(request, 64_000);
  if (!body.ok) return body.response;

  const parsed = articleSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid article" }, { status: 400 });
  }

  try {
    const article = await prisma.journalArticle.update({
      where: { id },
      data: {
        title: parsed.data.title,
        slug: parsed.data.slug,
        category: parsed.data.category,
        excerpt: parsed.data.excerpt,
        bodyJson: JSON.stringify(parsed.data.body),
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
