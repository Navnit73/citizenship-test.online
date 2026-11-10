import { describe, expect, it } from "vitest";
import { slugify } from "./slug";
import { sanitizeRichText } from "./sanitize";
import { parseQuestionsCsv } from "./csv";

describe("slugify", () => {
  it("makes url-safe slugs", () => {
    expect(slugify("  Life in the UK: Test (2026)! ")).toBe("life-in-the-uk-test-2026");
    expect(slugify("Québec & Ontario")).toBe("quebec-ontario");
    expect(slugify("---")).toBe("");
  });
});

describe("sanitizeRichText", () => {
  it("keeps safe formatting", () => {
    expect(
      sanitizeRichText("<h2>Hi</h2><p><strong>x</strong> <em>y</em></p><ul><li>a</li></ul>"),
    ).toBe("<h2>Hi</h2><p><strong>x</strong> <em>y</em></p><ul><li>a</li></ul>");
  });
  it("removes scripts, event handlers and javascript: links", () => {
    const out = sanitizeRichText(
      '<p onclick="x()">a</p><script>alert(1)</script><a href="javascript:alert(1)">l</a><img src=x onerror=alert(1)>',
    );
    expect(out).not.toMatch(/script|onclick|onerror|javascript:/i);
  });
  it("forces safe rel on external links", () => {
    const out = sanitizeRichText('<a href="https://example.com" target="_blank">x</a>');
    expect(out).toContain('rel="noopener noreferrer nofollow"');
  });
});

describe("parseQuestionsCsv", () => {
  const header =
    "countryCode,versions,chapter,type,prompt,options,correct,accepted,explanation,sourceRef,tags,difficulty,status";
  it("parses choice and text rows", () => {
    const csv = [
      header,
      'uk,3rd-edition,history,single,"In which year was Hastings?",a:1066|b:1215,a,,,Handbook,,2,published',
      "us,2025|2008,american-government,shorttext,Supreme law?,,,the Constitution|Constitution,,USCIS,civics|core,,draft",
    ].join("\n");
    const rows = parseQuestionsCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      countryCode: "uk",
      versions: ["3rd-edition"],
      chapter: "history",
      options: [
        { id: "a", text: "1066" },
        { id: "b", text: "1215" },
      ],
      correctOptionIds: ["a"],
      difficulty: 2,
      status: "published",
    });
    expect(rows[1]).toMatchObject({
      versions: ["2025", "2008"],
      acceptedAnswers: ["the Constitution", "Constitution"],
      tags: ["civics", "core"],
    });
  });
  it("skips blank lines", () => {
    expect(parseQuestionsCsv(`${header}\n\n`)).toEqual([]);
  });
});
