import type { MetadataRoute } from "next";
import { POST_BASE_PATH, postPath, type PublicPostType } from "@/lib/cms/paths";
import { listSitemapEntries } from "@/lib/cms/public";
import { COUNTRY_CODES } from "@/lib/countries";
import { COUNTRY_PAGES, countryPagePath, slotTarget } from "@/lib/site/country-pages";
import { INDEXABLE, SITE_URL } from "@/lib/site/config";

/** Data-driven country pages are always indexable; long-form ones only once the CMS has a body for them. */
const ALWAYS_INDEXED = new Set(["hub", "practice", "questions"]);
const LISTING_TYPES: PublicPostType[] = ["blog", "guide", "howto", "legal"];

/**
 * Every URL here is the page's own canonical (absolute, no trailing slash, no query).
 * No `lastModified` on purpose: entries carry only the URL.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!INDEXABLE) return [];
  const { posts, tests } = await listSitemapEntries();
  const url = (path: string) => `${SITE_URL}${path === "/" ? "" : path}`;

  // CMS bodies for country pages are served at their country URL, not /p/...
  const filledSlots = new Set<string>();
  for (const p of posts) {
    const target = p.type === "page" ? slotTarget(p.slug) : null;
    if (target) filledSlots.add(target);
  }

  const countryPages = COUNTRY_CODES.flatMap((c) =>
    COUNTRY_PAGES[c]
      .map((p) => countryPagePath(c, p.slug))
      .filter((path, i) => ALWAYS_INDEXED.has(COUNTRY_PAGES[c][i].kind) || filledSlots.has(path))
      .map((path) => ({ url: url(path) })),
  );

  const articles = posts.filter((p) => !(p.type === "page" && slotTarget(p.slug)));

  // Listing pages are noindex while empty, so only list the ones with content.
  const listings = LISTING_TYPES.flatMap((type) => {
    return articles.some((p) => p.type === type) ? [{ url: url(POST_BASE_PATH[type]) }] : [];
  });

  return [
    { url: url("/") },
    { url: url("/tests") },
    ...countryPages,
    ...listings,
    ...articles.map((p) => ({ url: url(postPath(p.type, p.slug)) })),
    ...tests.map((t) => ({ url: url(`/tests/${t.slug}`) })),
  ];
}
