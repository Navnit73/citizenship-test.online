import type { MetadataRoute } from "next";

import { SITE_URL as SITE } from "@/lib/site/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/login", "/dashboard"] },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
