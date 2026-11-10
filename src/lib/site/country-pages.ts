import type { CountryCode } from "@/lib/engine/types";

export type PageKind = "hub" | "practice" | "questions" | "guide" | "howto" | "english";

export type CountryPageDef = {
  slug: string;
  kind: PageKind;
  /** Short label for navigation and breadcrumbs. */
  label: string;
  /** <title>; written per country to match how people search for that exam. */
  title: string;
  /** On-page H1. Close to the title, but phrased for readers rather than result pages. */
  heading: string;
  /** Meta description: what the page offers, in under ~155 characters. */
  description: string;
};

type Copy = Pick<CountryPageDef, "title" | "heading" | "description">;
const page = (slug: string, kind: PageKind, label: string, copy: Copy): CountryPageDef => ({
  slug,
  kind,
  label,
  ...copy,
});

export const COUNTRY_PAGES: Record<CountryCode, CountryPageDef[]> = {
  us: [
    page("citizenship-test", "hub", "US Citizenship Test", {
      title: "US citizenship test: format, pass mark and free practice",
      heading: "US citizenship test: rules, format and free practice",
      description:
        "How the US naturalization civics test works: how many questions you are asked, the pass mark and the interview format, plus free practice tests with answers.",
    }),
    page("practice-test", "practice", "Practice test", {
      title: "Free US citizenship practice test (civics test)",
      heading: "US citizenship practice test",
      description:
        "Free US citizenship practice test that follows the USCIS civics test rules. See the correct answer and an explanation after every question.",
    }),
    page("civics-questions", "questions", "Civics questions and answers", {
      title: "US civics test questions and answers",
      heading: "US civics test questions and answers",
      description:
        "Browse the US citizenship civics test questions by topic, with the correct answers, short explanations and the official source for each one.",
    }),
    page("english-test", "english", "English reading and writing test", {
      title: "US citizenship English test: reading and writing",
      heading: "US citizenship English test: reading and writing",
      description:
        "Practice the English reading and writing portions of the US naturalization interview.",
    }),
    page("naturalization-guide", "guide", "Naturalization guide", {
      title: "US naturalization guide: how to become a citizen",
      heading: "US naturalization guide",
      description:
        "A plain-English guide to the US naturalization process, from checking eligibility and applying to the interview, civics test and oath.",
    }),
  ],
  uk: [
    page("life-in-the-uk-test", "hub", "Life in the UK Test", {
      title: "Life in the UK Test: format, pass mark and free practice",
      heading: "Life in the UK Test: rules, format and free practice",
      description:
        "How the Life in the UK Test works: number of questions, pass mark and time limit, plus free practice tests with answers and explanations.",
    }),
    page("practice-test", "practice", "Practice test", {
      title: "Free Life in the UK practice test",
      heading: "Life in the UK practice test",
      description:
        "Take a free Life in the UK practice test with the same question count, pass mark and time limit as the real test. See the answer after each question.",
    }),
    page("questions", "questions", "Questions and answers", {
      title: "Life in the UK test questions and answers",
      heading: "Life in the UK test questions and answers",
      description:
        "Browse Life in the UK test practice questions by chapter, with the correct answers, explanations and the source for each one.",
    }),
    page("study-guide", "guide", "Study guide", {
      title: "Life in the UK test study guide",
      heading: "Life in the UK test study guide",
      description:
        "How to study for the Life in the UK Test: what the official handbook covers, how to plan your revision and how to tell when you are ready.",
    }),
    page("how-to-book", "howto", "How to book", {
      title: "How to book the Life in the UK Test",
      heading: "How to book the Life in the UK Test",
      description:
        "Step by step: how to book your Life in the UK Test and what you need to have ready before you book.",
    }),
    page("english-requirement", "howto", "English language requirement", {
      title: "English language requirement for UK citizenship",
      heading: "English language requirement for UK citizenship",
      description:
        "How the English language requirement works for British citizenship applications.",
    }),
  ],
  ca: [
    page("citizenship-test", "hub", "Canadian Citizenship Test", {
      title: "Canadian citizenship test: format, pass mark and practice",
      heading: "Canadian citizenship test: rules, format and free practice",
      description:
        "How the Canadian citizenship test works: number of questions, pass mark, time limit and topics, plus free practice tests with answers.",
    }),
    page("practice-test", "practice", "Practice test", {
      title: "Free Canadian citizenship practice test",
      heading: "Canadian citizenship practice test",
      description:
        "Take a free Canadian citizenship practice test that follows the real test rules. See the correct answer and an explanation after every question.",
    }),
    page("questions", "questions", "Questions and answers", {
      title: "Canadian citizenship test questions and answers",
      heading: "Canadian citizenship test questions and answers",
      description:
        "Browse Canadian citizenship test practice questions by topic, with the correct answers, explanations and the source for each one.",
    }),
    page("study-guide", "guide", "Study guide", {
      title: "Canadian citizenship test study guide",
      heading: "Canadian citizenship test study guide",
      description:
        "How to study for the Canadian citizenship test: what the official study guide covers, how to plan your study time and how to tell when you are ready.",
    }),
    page("how-to-apply", "howto", "How to apply", {
      title: "How to apply for Canadian citizenship",
      heading: "How to apply for Canadian citizenship",
      description:
        "How to apply for Canadian citizenship step by step, and where the citizenship test fits into the process.",
    }),
  ],
  au: [
    page("citizenship-test", "hub", "Australian Citizenship Test", {
      title: "Australian citizenship test: format, pass mark and practice",
      heading: "Australian citizenship test: rules, format and free practice",
      description:
        "How the Australian citizenship test works: number of questions, pass mark, time limit and the values questions, plus free practice tests with answers.",
    }),
    page("practice-test", "practice", "Practice test", {
      title: "Free Australian citizenship practice test",
      heading: "Australian citizenship practice test",
      description:
        "Take a free Australian citizenship practice test that follows the real test rules. See the correct answer and an explanation after every question.",
    }),
    page("questions", "questions", "Questions and answers", {
      title: "Australian citizenship test questions and answers",
      heading: "Australian citizenship test questions and answers",
      description:
        "Browse Australian citizenship test practice questions by topic, with the correct answers, explanations and the source for each one.",
    }),
    page("study-guide", "guide", "Study guide", {
      title: "Australian citizenship test study guide",
      heading: "Australian citizenship test study guide",
      description:
        "How to study for the Australian citizenship test: what the official resource book covers, how to plan your study time and how to tell when you are ready.",
    }),
    page("how-to-apply", "howto", "How to apply", {
      title: "How to apply for Australian citizenship",
      heading: "How to apply for Australian citizenship",
      description:
        "How to apply for Australian citizenship by conferral step by step, and where the citizenship test fits into the process.",
    }),
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
