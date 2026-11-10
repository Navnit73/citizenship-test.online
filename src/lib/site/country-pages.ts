import type { CountryCode } from "@/lib/engine/types";

export type PageKind = "hub" | "practice" | "questions" | "guide" | "howto" | "english";

export type CountryPageDef = {
  slug: string;
  kind: PageKind;
  /** Short label for navigation and breadcrumbs. */
  label: string;
  /** Title builder; receives the country's display name. */
  title: (country: string) => string;
  description: (country: string) => string;
};

const hub = (slug: string, testName: string): CountryPageDef => ({
  slug,
  kind: "hub",
  label: testName,
  title: () => `${testName}: rules, format and free practice`,
  description: (c) =>
    `Everything you need to know about the ${testName} for ${c}: format, pass mark, study plan and free practice tests.`,
});
const practice: CountryPageDef = {
  slug: "practice-test",
  kind: "practice",
  label: "Practice test",
  title: (c) => `${c} citizenship practice test (free)`,
  description: (c) =>
    `Take a free ${c} citizenship practice test that follows the real exam rules, with explanations for every answer.`,
};
const questions = (slug: string): CountryPageDef => ({
  slug,
  kind: "questions",
  label: "Questions and answers",
  title: (c) => `${c} citizenship test questions and answers`,
  description: (c) =>
    `Browse ${c} citizenship test questions by chapter, with correct answers, explanations and sources.`,
});
const guide = (slug: string, label: string): CountryPageDef => ({
  slug,
  kind: "guide",
  label,
  title: (c) => `${label}: ${c}`,
  description: (c) => `${label} for the ${c} citizenship process.`,
});
const howto = (slug: string, label: string): CountryPageDef => ({
  slug,
  kind: "howto",
  label,
  title: (c) => `${label}: ${c} citizenship test`,
  description: (c) => `${label} for the ${c} citizenship test, step by step.`,
});

export const COUNTRY_PAGES: Record<CountryCode, CountryPageDef[]> = {
  us: [
    hub("citizenship-test", "US Citizenship Test"),
    practice,
    questions("civics-questions"),
    {
      slug: "english-test",
      kind: "english",
      label: "English reading and writing test",
      title: () => "US citizenship English test: reading and writing",
      description: () =>
        "Practice the English reading and writing portions of the US naturalization interview.",
    },
    guide("naturalization-guide", "Naturalization guide"),
  ],
  uk: [
    hub("life-in-the-uk-test", "Life in the UK Test"),
    practice,
    questions("questions"),
    guide("study-guide", "Study guide"),
    howto("how-to-book", "How to book"),
    {
      slug: "english-requirement",
      kind: "howto",
      label: "English language requirement",
      title: () => "English language requirement for UK citizenship",
      description: () =>
        "How the English language requirement works for British citizenship applications.",
    },
  ],
  ca: [
    hub("citizenship-test", "Canadian Citizenship Test"),
    practice,
    questions("questions"),
    guide("study-guide", "Study guide"),
    howto("how-to-apply", "How to apply"),
  ],
  au: [
    hub("citizenship-test", "Australian Citizenship Test"),
    practice,
    questions("questions"),
    guide("study-guide", "Study guide"),
    howto("how-to-apply", "How to apply"),
  ],
};

export const getCountryPage = (code: CountryCode, slug: string) =>
  COUNTRY_PAGES[code].find((p) => p.slug === slug);

export const countryPagePath = (code: CountryCode, slug: string) => `/${code}/${slug}`;

export const hubPage = (code: CountryCode) => COUNTRY_PAGES[code].find((p) => p.kind === "hub")!;
export const hubPath = (code: CountryCode) => countryPagePath(code, hubPage(code).slug);

/** Params for `[country]/[page]`; the practice page has its own route. */
export function allCountryPageParams() {
  return (Object.keys(COUNTRY_PAGES) as CountryCode[]).flatMap((country) =>
    COUNTRY_PAGES[country]
      .filter((p) => p.kind !== "practice")
      .map((p) => ({ country, page: p.slug })),
  );
}

/** Page-type CMS posts named `{country}-{page}` supply the body of that country page. */
export function slotTarget(slug: string): string | null {
  const m = /^(us|uk|ca|au)-(.+)$/.exec(slug);
  if (!m) return null;
  const def = getCountryPage(m[1] as CountryCode, m[2]);
  return def && def.kind !== "practice" ? countryPagePath(m[1] as CountryCode, m[2]) : null;
}
