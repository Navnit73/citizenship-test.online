import type { MetadataRoute } from "next";
import { postPath } from "@/lib/cms/paths";
import { listSitemapEntries } from "@/lib/cms/public";
import { COUNTRY_CODES } from "@/lib/countries";
import { COUNTRY_PAGES, countryPagePath, slotTarget } from "@/lib/site/country-pages";
import { SITE_URL } from "@/lib/site/config";

/** Data-driven country pages are always indexable; long-form ones only once the CMS has a body for them. */
const ALWAYS_INDEXED = new Set(["hub", "practice", "questions"]);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { posts, tests } = await listSitemapEntries();
  const written = new Set(
    posts
      .filter((p) => p.type === "page")
      .map((p) => slotTarget(p.slug))
      .filter(Boolean),
  );
  const countryPages = COUNTRY_CODES.flatMap((c) =>
    COUNTRY_PAGES[c]
      .filter((p) => ALWAYS_INDEXED.has(p.kind) || written.has(countryPagePath(c, p.slug)))
      .map((p) => ({ url: `${SITE_URL}${countryPagePath(c, p.slug)}` })),
  );
  return [
    { url: `${SITE_URL}/` },
    { url: `${SITE_URL}/tests` },
    ...["/blog", "/guides", "/how-to", "/legal"].map((p) => ({ url: `${SITE_URL}${p}` })),
    ...countryPages,
    // CMS bodies for country pages are served at their country URL, not /p/...
    ...posts
      .filter((p) => !(p.type === "page" && slotTarget(p.slug)))
      .map((p) => ({
        url: `${SITE_URL}${postPath(p.type, p.slug)}`,
        lastModified: p.lastModified,
      })),
    ...tests.map((t) => ({ url: `${SITE_URL}/tests/${t.slug}`, lastModified: t.lastModified })),
  ];
}
