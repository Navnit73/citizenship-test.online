import { describe, expect, it } from "vitest";
import { COUNTRY_CODES } from "@/lib/countries";
import {
  COUNTRY_PAGES,
  allCountryPageParams,
  countryPagePath,
  getCountryPage,
  hubPath,
  slotTarget,
} from "./country-pages";

describe("country page registry", () => {
  it("defines the five core pages per country (20 total) plus the UK English page", () => {
    const counts = Object.fromEntries(COUNTRY_CODES.map((c) => [c, COUNTRY_PAGES[c].length]));
    expect(counts).toEqual({ us: 5, uk: 6, ca: 5, au: 5 });
  });
  it("every country has exactly one hub and one practice page", () => {
    for (const c of COUNTRY_CODES) {
      expect(COUNTRY_PAGES[c].filter((p) => p.kind === "hub")).toHaveLength(1);
      expect(COUNTRY_PAGES[c].filter((p) => p.kind === "practice")).toHaveLength(1);
    }
  });
  it("uses the keyword-targeted URLs from the PRD", () => {
    expect(hubPath("uk")).toBe("/uk/life-in-the-uk-test");
    expect(hubPath("us")).toBe("/us/citizenship-test");
    expect(countryPagePath("us", "civics-questions")).toBe("/us/civics-questions");
    expect(countryPagePath("uk", "how-to-book")).toBe("/uk/how-to-book");
    expect(countryPagePath("au", "how-to-apply")).toBe("/au/how-to-apply");
  });
  it("slugs are unique within a country", () => {
    for (const c of COUNTRY_CODES) {
      const slugs = COUNTRY_PAGES[c].map((p) => p.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });
  it("looks pages up and rejects unknown ones", () => {
    expect(getCountryPage("ca", "study-guide")?.kind).toBe("guide");
    expect(getCountryPage("ca", "nope")).toBeUndefined();
  });
  it("static params exclude the practice page (it has its own route)", () => {
    const params = allCountryPageParams();
    expect(params.some((p) => p.page === "practice-test")).toBe(false);
    expect(params).toContainEqual({ country: "uk", page: "english-requirement" });
  });
});

describe("slotTarget", () => {
  it("maps `{country}-{page}` CMS page slugs to the country page they feed", () => {
    expect(slotTarget("uk-study-guide")).toBe("/uk/study-guide");
    expect(slotTarget("us-naturalization-guide")).toBe("/us/naturalization-guide");
    expect(slotTarget("au-citizenship-test")).toBe("/au/citizenship-test");
  });
  it("ignores ordinary pages, unknown pages and the practice page", () => {
    expect(slotTarget("about")).toBeNull();
    expect(slotTarget("uk-unknown")).toBeNull();
    expect(slotTarget("uk-practice-test")).toBeNull();
    expect(slotTarget("fr-study-guide")).toBeNull();
  });
});

describe("page copy", () => {
  const all = COUNTRY_CODES.flatMap((c) => COUNTRY_PAGES[c]);
  it("every page has a title, heading, description and label of sensible length", () => {
    for (const p of all) {
      expect(p.title.length).toBeGreaterThan(10);
      expect(p.title.length).toBeLessThanOrEqual(60);
      expect(p.heading.length).toBeGreaterThan(10);
      expect(p.description.length).toBeGreaterThan(50);
      expect(p.description.length).toBeLessThanOrEqual(160);
      expect(p.label.length).toBeGreaterThan(2);
    }
  });
  it("titles and descriptions are unique across every country page", () => {
    expect(new Set(all.map((p) => p.title)).size).toBe(all.length);
    expect(new Set(all.map((p) => p.description)).size).toBe(all.length);
  });
  it("uses each country's own search terms", () => {
    expect(getCountryPage("uk", "practice-test")!.title).toContain("Life in the UK");
    expect(getCountryPage("ca", "practice-test")!.title).toContain("Canadian");
    expect(getCountryPage("au", "practice-test")!.title).toContain("Australian");
    expect(getCountryPage("us", "civics-questions")!.title).toContain("civics");
  });
});
