import { z } from "zod";

export const journalBlockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("paragraph"),
    text: z.string().trim().min(1).max(4000),
  }),
  z.object({
    type: z.literal("image"),
    src: z
      .string()
      .trim()
      .min(1)
      .max(400)
      .refine(
        (v) => v.startsWith("/") || /^https?:\/\//i.test(v),
        "Image path required",
      ),
    caption: z.string().trim().max(200).optional(),
  }),
]);

export const journalArticleSchema = z.object({
  title: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, hyphens"),
  category: z.string().trim().min(2).max(60),
  excerpt: z.string().trim().min(5).max(400),
  blocks: z.array(journalBlockSchema).min(1).max(60),
  imageUrl: z
    .string()
    .trim()
    .min(1)
    .max(400)
    .refine(
      (v) => v.startsWith("/") || /^https?:\/\//i.test(v),
      "Preview image required",
    ),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  readTime: z.string().trim().min(2).max(20),
  active: z.boolean(),
  sortOrder: z.number().int().min(0).max(999),
});
