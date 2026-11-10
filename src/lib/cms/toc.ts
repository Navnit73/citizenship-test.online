import { slugify } from "./slug";

export type TocItem = { id: string; text: string; level: 2 | 3 };

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

/** Adds anchor ids to h2/h3 (sanitised TipTap output has no attributes) and builds a TOC. */
export function addHeadingIds(html: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const used = new Map<string, number>();
  const out = html.replace(/<(h[23])>([\s\S]*?)<\/\1>/g, (match, tag: string, inner: string) => {
    const text = decode(inner.replace(/<[^>]*>/g, "")).trim();
    const base = slugify(text);
    if (!base) return match;
    const n = (used.get(base) ?? 0) + 1;
    used.set(base, n);
    const id = n === 1 ? base : `${base}-${n}`;
    toc.push({ id, text, level: tag === "h2" ? 2 : 3 });
    return `<${tag} id="${id}">${inner}</${tag}>`;
  });
  return { html: out, toc };
}
