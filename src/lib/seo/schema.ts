const CONTEXT = "https://schema.org";
export const SITE_NAME = "citizenship-test.online";
const LANGUAGE = "en";

const abs = (site: string, path: string) => new URL(path, site).toString();

/** Stable node ids so every page can point at the same Organization / WebSite. */
export const orgId = (site: string) => `${abs(site, "/")}#organization`;
export const websiteId = (site: string) => `${abs(site, "/")}#website`;

export function organizationLd(site: string) {
  return {
    "@context": CONTEXT,
    "@type": "Organization",
    "@id": orgId(site),
    name: SITE_NAME,
    url: abs(site, "/"),
    description:
      "Free citizenship test practice for the US, UK, Canada and Australia. Not affiliated with any government.",
  } as const;
}

export function websiteLd(site: string) {
  return {
    "@context": CONTEXT,
    "@type": "WebSite",
    "@id": websiteId(site),
    name: SITE_NAME,
    url: abs(site, "/"),
    inLanguage: LANGUAGE,
    publisher: { "@id": orgId(site) },
  } as const;
}

export function breadcrumbLd(site: string, items: { name: string; path: string }[]) {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem" as const,
      position: i + 1,
      name: it.name,
      item: abs(site, it.path),
    })),
  };
}

export function faqLd(items: { q: string; a: string }[]) {
  return {
    "@context": CONTEXT,
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question" as const,
      name: f.q,
      acceptedAnswer: { "@type": "Answer" as const, text: f.a },
    })),
  };
}

export function articleLd(
  site: string,
  a: { title: string; path: string; description?: string; publishedAt?: Date; updatedAt?: Date },
) {
  const url = abs(site, a.path);
  return {
    "@context": CONTEXT,
    "@type": "Article",
    "@id": `${url}#article`,
    headline: a.title,
    mainEntityOfPage: url,
    inLanguage: LANGUAGE,
    ...(a.description && { description: a.description }),
    ...(a.publishedAt && { datePublished: a.publishedAt.toISOString() }),
    ...(a.updatedAt && { dateModified: a.updatedAt.toISOString() }),
    // Posts carry no named author, so the site itself is credited (no invented people).
    author: { "@type": "Organization", "@id": orgId(site), name: SITE_NAME, url: abs(site, "/") },
    publisher: { "@type": "Organization", "@id": orgId(site), name: SITE_NAME },
    isPartOf: { "@id": websiteId(site) },
  };
}

/** Lists question text only; answers are deliberately never exposed in markup. */
export function quizLd(q: { name: string; url: string; questions: string[] }) {
  return {
    "@context": CONTEXT,
    "@type": "Quiz",
    name: q.name,
    url: q.url,
    inLanguage: LANGUAGE,
    educationalLevel: "Adult education",
    isAccessibleForFree: true,
    hasPart: q.questions.map((name) => ({ "@type": "Question" as const, name })),
  };
}

/** JSON for a <script type="application/ld+json"> body that cannot close the tag early. */
export function serializeLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
