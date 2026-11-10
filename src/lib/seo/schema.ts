const CONTEXT = "https://schema.org";
export const SITE_NAME = "citizenship-test.online";

const abs = (site: string, path: string) => new URL(path, site).toString();

export function organizationLd(site: string) {
  return {
    "@context": CONTEXT,
    "@type": "Organization",
    name: SITE_NAME,
    url: site,
    description:
      "Free citizenship test practice for the US, UK, Canada and Australia. Not affiliated with any government.",
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
  return {
    "@context": CONTEXT,
    "@type": "Article",
    headline: a.title,
    mainEntityOfPage: abs(site, a.path),
    ...(a.description && { description: a.description }),
    ...(a.publishedAt && { datePublished: a.publishedAt.toISOString() }),
    ...(a.updatedAt && { dateModified: a.updatedAt.toISOString() }),
    publisher: { "@type": "Organization", name: SITE_NAME },
  };
}

/** Lists question text only; answers are deliberately never exposed in markup. */
export function quizLd(q: { name: string; url: string; questions: string[] }) {
  return {
    "@context": CONTEXT,
    "@type": "Quiz",
    name: q.name,
    url: q.url,
    educationalLevel: "Adult education",
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
