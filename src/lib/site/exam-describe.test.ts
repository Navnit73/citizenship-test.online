import { describe, expect, it } from "vitest";
import type { ExamVersion } from "@/lib/engine/types";
import { buildCountryFaq, describeExam } from "./exam-describe";

const uk: ExamVersion = {
  key: "uk",
  questionsAsked: 24,
  poolSize: 1000,
  passRule: { type: "percent", value: 75 },
  stopWhenPassed: false,
  timeLimitSec: 2700,
};
const us: ExamVersion = {
  key: "2025",
  questionsAsked: 20,
  poolSize: 128,
  passRule: { type: "count", value: 12 },
  stopWhenPassed: true,
};
const au: ExamVersion = {
  ...uk,
  key: "au",
  questionsAsked: 20,
  requiredTags: [{ tag: "values", mustAllBeCorrect: true }],
};

describe("describeExam", () => {
  it("describes a percent rule with the derived count and time", () => {
    expect(describeExam(uk)).toMatchObject({
      questions: "24 questions",
      passMark: "75% (18 of 24)",
      time: "45 minutes",
    });
  });
  it("describes a count rule with early stopping and no timer", () => {
    const d = describeExam(us);
    expect(d.passMark).toBe("12 of 20");
    expect(d.time).toBe("No fixed time limit");
    expect(d.notes).toContain("The test stops as soon as you pass or can no longer pass.");
  });
  it("lists required-tag rules", () => {
    expect(describeExam(au).notes).toContain("You must answer every “values” question correctly.");
  });
  it("reports pool size when known", () => {
    expect(describeExam(us).pool).toBe("Up to 20 questions drawn from a pool of 128");
  });
});

describe("buildCountryFaq", () => {
  const faq = buildCountryFaq({
    countryName: "the United Kingdom",
    testName: "Life in the UK Test",
    version: uk,
    officialUrl: "https://www.gov.uk/x",
  });
  it("derives answers from the exam rules", () => {
    const text = JSON.stringify(faq);
    expect(text).toContain("24 questions");
    expect(text).toContain("45 minutes");
    expect(text).toContain("75% (18 of 24)");
  });
  it("is clear that the site is unofficial and links the official source", () => {
    const official = faq.find((f) => /official/i.test(f.q))!;
    expect(official.a).toMatch(/not affiliated/i);
    expect(official.a).toContain("https://www.gov.uk/x");
  });
  it("has at least four entries with non-empty text", () => {
    expect(faq.length).toBeGreaterThanOrEqual(4);
    expect(faq.every((f) => f.q && f.a)).toBe(true);
  });
});
