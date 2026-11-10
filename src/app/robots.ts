import type { MetadataRoute } from "next";

import { INDEXABLE, SITE_URL as SITE } from "@/lib/site/config";

/**
 * robots.txt only steers crawlers; access control lives in the admin guard.
 * `/login` is deliberately crawlable so its `noindex` tag can be seen, and the public
 * exam APIs stay open because the practice-test player needs them to render.
 */
export default function robots(): MetadataRoute.Robots {
  if (!INDEXABLE) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/api/exams/", "/api/tests/"],
      disallow: ["/admin", "/api/"],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
