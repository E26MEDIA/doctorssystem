export type JournalBlock =
  | { type: "paragraph"; text: string }
  | { type: "image"; src: string; caption?: string };

export type JournalArticleSeed = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  publishedAt: string;
  readTime: string;
  imageUrl: string;
  blocks: JournalBlock[];
};

/** Normalize legacy string[] bodies and new block arrays into JournalBlock[]. */
export function parseJournalBlocks(value: string): JournalBlock[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return [];

    if (parsed.every((item) => typeof item === "string")) {
      return (parsed as string[])
        .map((text) => text.trim())
        .filter(Boolean)
        .map((text) => ({ type: "paragraph" as const, text }));
    }

    const blocks: JournalBlock[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      if (row.type === "paragraph" && typeof row.text === "string") {
        const text = row.text.trim();
        if (text) blocks.push({ type: "paragraph", text });
      } else if (row.type === "image" && typeof row.src === "string") {
        const src = row.src.trim();
        if (!src) continue;
        const caption =
          typeof row.caption === "string" && row.caption.trim()
            ? row.caption.trim()
            : undefined;
        blocks.push({ type: "image", src, caption });
      }
    }
    return blocks;
  } catch {
    return value
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((text) => ({ type: "paragraph" as const, text }));
  }
}

export function blocksToParagraphPreview(blocks: JournalBlock[]): string[] {
  return blocks
    .filter((b): b is Extract<JournalBlock, { type: "paragraph" }> => b.type === "paragraph")
    .map((b) => b.text);
}

export function isLegacyStringBody(value: string): boolean {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string");
  } catch {
    return true;
  }
}
