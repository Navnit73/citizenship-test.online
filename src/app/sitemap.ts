import type { MetadataRoute } from "next";
import { postPath } from "@/lib/cms/paths";
import { listSitemapEntries } from "@/lib/cms/public";
import { COUNTRY_CODES } from "@/lib/countries";

const SITE = process.env.SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { posts, tests } = await listSitemapEntries();
  return [
    { url: `${SITE}/` },
    { url: `${SITE}/tests` },
    ...["/blog", "/guides", "/how-to", "/legal"].map((p) => ({ url: `${SITE}${p}` })),
    ...COUNTRY_CODES.map((c) => ({ url: `${SITE}/${c}/practice-test` })),
    ...posts.map((p) => ({
      url: `${SITE}${postPath(p.type, p.slug)}`,
      lastModified: p.lastModified,
    })),
    ...tests.map((t) => ({ url: `${SITE}/tests/${t.slug}`, lastModified: t.lastModified })),
  ];
}
