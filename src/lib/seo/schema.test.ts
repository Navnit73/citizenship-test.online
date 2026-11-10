import { describe, expect, it } from "vitest";
import {
  articleLd,
  breadcrumbLd,
  faqLd,
  organizationLd,
  quizLd,
  serializeLd,
  websiteLd,
} from "./schema";

const SITE = "https://example.test";

describe("json-ld builders", () => {
  it("organization", () => {
    expect(organizationLd(SITE)).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://example.test/#organization",
      url: "https://example.test/",
      name: "citizenship-test.online",
    });
  });
  it("website points at the organization as publisher", () => {
    expect(websiteLd(SITE)).toMatchObject({
      "@type": "WebSite",
      "@id": "https://example.test/#website",
      publisher: { "@id": "https://example.test/#organization" },
    });
  });
  it("breadcrumbs are 1-indexed with absolute URLs", () => {
    const ld = breadcrumbLd(SITE, [
      { name: "Home", path: "/" },
      { name: "UK", path: "/uk/life-in-the-uk-test" },
    ]);
    expect(ld["@type"]).toBe("BreadcrumbList");
    expect(ld.itemListElement[1]).toEqual({
      "@type": "ListItem",
      position: 2,
      name: "UK",
      item: "https://example.test/uk/life-in-the-uk-test",
    });
  });
  it("faq page", () => {
    const ld = faqLd([{ q: "Free?", a: "Yes." }]);
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity[0]).toEqual({
      "@type": "Question",
      name: "Free?",
      acceptedAnswer: { "@type": "Answer", text: "Yes." },
    });
  });
  it("article", () => {
    const ld = articleLd(SITE, {
      title: "T",
      path: "/guides/t",
      description: "D",
      publishedAt: new Date("2026-01-02T00:00:00Z"),
      updatedAt: new Date("2026-02-03T00:00:00Z"),
    });
    expect(ld).toMatchObject({
      "@type": "Article",
      headline: "T",
      datePublished: "2026-01-02T00:00:00.000Z",
      dateModified: "2026-02-03T00:00:00.000Z",
      mainEntityOfPage: "https://example.test/guides/t",
      author: { "@id": "https://example.test/#organization" },
      publisher: { "@id": "https://example.test/#organization" },
    });
  });
  it("article omits missing optional fields", () => {
    const ld = articleLd(SITE, { title: "T", path: "/x" });
    expect(ld).not.toHaveProperty("datePublished");
    expect(ld).not.toHaveProperty("description");
  });
  it("quiz lists question names only (never answers)", () => {
    const ld = quizLd({
      name: "UK practice test",
      url: `${SITE}/uk/practice-test`,
      questions: ["Q1?", "Q2?"],
    });
    expect(ld["@type"]).toBe("Quiz");
    expect(ld.hasPart).toHaveLength(2);
    expect(JSON.stringify(ld)).not.toMatch(/acceptedAnswer/);
  });
  it("serializeLd escapes characters that could break out of a script tag", () => {
    const out = serializeLd({ a: "</script><script>alert(1)</script>", b: " " });
    expect(out).not.toContain("</script>");
    expect(out).not.toContain("<");
    expect(JSON.parse(out).a).toBe("</script><script>alert(1)</script>");
  });
});
