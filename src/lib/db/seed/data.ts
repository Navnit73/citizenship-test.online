/**
 * SAMPLE content for development. Verify every fact and exam rule against the
 * official sources before publishing (see prd.md research note).
 */
import type { CountryCode } from "@/lib/engine/types";
import type { QuestionInput } from "../repos/questions";

export const countries = [
  {
    code: "us" as const,
    name: "United States",
    slug: "us",
    officialSourceUrl: "https://www.uscis.gov/citizenship/find-study-materials-and-resources",
    examConfig: {
      activeVersion: "2025",
      versions: [
        {
          key: "2025",
          questionsAsked: 20,
          poolSize: 128,
          passRule: { type: "count", value: 12 },
          stopWhenPassed: true,
        },
        {
          key: "2008",
          questionsAsked: 10,
          poolSize: 100,
          passRule: { type: "count", value: 6 },
          stopWhenPassed: true,
        },
      ],
    },
  },
  {
    code: "uk" as const,
    name: "United Kingdom",
    slug: "uk",
    officialSourceUrl: "https://www.gov.uk/life-in-the-uk-test",
    examConfig: {
      activeVersion: "3rd-edition",
      versions: [
        {
          key: "3rd-edition",
          questionsAsked: 24,
          poolSize: 1000,
          passRule: { type: "percent", value: 75 },
          stopWhenPassed: false,
          timeLimitSec: 2700,
        },
      ],
    },
  },
  {
    code: "ca" as const,
    name: "Canada",
    slug: "ca",
    officialSourceUrl:
      "https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-citizenship/become-canadian-citizen/citizenship-test-interview.html",
    examConfig: {
      activeVersion: "discover-canada",
      versions: [
        {
          key: "discover-canada",
          questionsAsked: 20,
          poolSize: 500,
          passRule: { type: "percent", value: 75 },
          stopWhenPassed: false,
          timeLimitSec: 1800,
        },
      ],
    },
  },
  {
    code: "au" as const,
    name: "Australia",
    slug: "au",
    officialSourceUrl: "https://immi.homeaffairs.gov.au/citizenship/test-and-interview",
    examConfig: {
      activeVersion: "our-common-bond",
      versions: [
        {
          key: "our-common-bond",
          questionsAsked: 20,
          poolSize: 500,
          passRule: { type: "percent", value: 75 },
          requiredTags: [{ tag: "values", mustAllBeCorrect: true }],
          stopWhenPassed: false,
          timeLimitSec: 2700,
        },
      ],
    },
  },
];

export const chapters: { countryCode: CountryCode; slug: string; title: string; order: number }[] =
  [
    { countryCode: "us", slug: "american-government", title: "American Government", order: 1 },
    { countryCode: "us", slug: "american-history", title: "American History", order: 2 },
    { countryCode: "uk", slug: "history", title: "A long and illustrious history", order: 1 },
    { countryCode: "uk", slug: "what-is-the-uk", title: "What is the UK?", order: 2 },
    { countryCode: "ca", slug: "who-we-are", title: "Who We Are", order: 1 },
    { countryCode: "ca", slug: "symbols", title: "Canadian Symbols", order: 2 },
    {
      countryCode: "au",
      slug: "australia-and-its-people",
      title: "Australia and its people",
      order: 1,
    },
    { countryCode: "au", slug: "australian-values", title: "Australian values", order: 4 },
  ];

type SeedQuestion = Omit<QuestionInput, "chapterId" | "status"> & { chapterSlug: string };

const tf = [
  { id: "true", text: "True" },
  { id: "false", text: "False" },
];

export const questions: SeedQuestion[] = [
  // United States (short text, fuzzy matched)
  {
    countryCode: "us",
    versions: ["2025", "2008"],
    chapterSlug: "american-government",
    type: "shorttext",
    prompt: "What is the supreme law of the land?",
    acceptedAnswers: ["the Constitution", "Constitution"],
    sourceRef: "USCIS civics test study materials",
    explanation: "The Constitution is the supreme law of the land.",
  },
  {
    countryCode: "us",
    versions: ["2025", "2008"],
    chapterSlug: "american-government",
    type: "shorttext",
    prompt: "How many amendments does the Constitution have?",
    acceptedAnswers: ["27", "twenty-seven"],
    sourceRef: "USCIS civics test study materials",
  },
  {
    countryCode: "us",
    versions: ["2025", "2008"],
    chapterSlug: "american-government",
    type: "shorttext",
    prompt: "What is the capital of the United States?",
    acceptedAnswers: ["Washington, D.C.", "Washington DC"],
    sourceRef: "USCIS civics test study materials",
  },
  {
    countryCode: "us",
    versions: ["2025", "2008"],
    chapterSlug: "american-history",
    type: "shorttext",
    prompt: "Who was the first President of the United States?",
    acceptedAnswers: ["George Washington", "Washington"],
    sourceRef: "USCIS civics test study materials",
  },
  {
    countryCode: "us",
    versions: ["2025", "2008"],
    chapterSlug: "american-government",
    type: "shorttext",
    prompt: "Who is the Governor of your state now?",
    acceptedAnswers: [],
    tags: ["state-specific"],
    sourceRef: "USCIS civics test study materials",
    explanation: "Answer depends on the applicant's state; resolved from a state selector.",
  },
  // United Kingdom
  {
    countryCode: "uk",
    versions: ["3rd-edition"],
    chapterSlug: "history",
    type: "single",
    prompt: "In which year was the Battle of Hastings?",
    options: [
      { id: "a", text: "1066" },
      { id: "b", text: "1215" },
      { id: "c", text: "1415" },
      { id: "d", text: "1688" },
    ],
    correctOptionIds: ["a"],
    sourceRef: "Life in the UK handbook: A long and illustrious history",
  },
  {
    countryCode: "uk",
    versions: ["3rd-edition"],
    chapterSlug: "history",
    type: "single",
    prompt: "In which year was Magna Carta sealed?",
    options: [
      { id: "a", text: "1066" },
      { id: "b", text: "1215" },
      { id: "c", text: "1415" },
      { id: "d", text: "1688" },
    ],
    correctOptionIds: ["b"],
    sourceRef: "Life in the UK handbook: A long and illustrious history",
  },
  {
    countryCode: "uk",
    versions: ["3rd-edition"],
    chapterSlug: "what-is-the-uk",
    type: "multiple",
    prompt: "Which TWO of these are countries of the UK?",
    options: [
      { id: "a", text: "Wales" },
      { id: "b", text: "France" },
      { id: "c", text: "Scotland" },
      { id: "d", text: "Spain" },
    ],
    correctOptionIds: ["a", "c"],
    sourceRef: "Life in the UK handbook: What is the UK?",
  },
  {
    countryCode: "uk",
    versions: ["3rd-edition"],
    chapterSlug: "what-is-the-uk",
    type: "single",
    prompt: "What is the capital city of Wales?",
    options: [
      { id: "a", text: "Cardiff" },
      { id: "b", text: "Swansea" },
      { id: "c", text: "Newport" },
      { id: "d", text: "Bangor" },
    ],
    correctOptionIds: ["a"],
    sourceRef: "Life in the UK handbook: What is the UK?",
  },
  // Canada
  {
    countryCode: "ca",
    versions: ["discover-canada"],
    chapterSlug: "who-we-are",
    type: "single",
    prompt: "How many provinces does Canada have?",
    options: [
      { id: "a", text: "10" },
      { id: "b", text: "9" },
      { id: "c", text: "13" },
      { id: "d", text: "12" },
    ],
    correctOptionIds: ["a"],
    sourceRef: "Discover Canada: Who We Are",
  },
  {
    countryCode: "ca",
    versions: ["discover-canada"],
    chapterSlug: "symbols",
    type: "single",
    prompt: "What is the capital of Canada?",
    options: [
      { id: "a", text: "Toronto" },
      { id: "b", text: "Ottawa" },
      { id: "c", text: "Montreal" },
      { id: "d", text: "Quebec City" },
    ],
    correctOptionIds: ["b"],
    sourceRef: "Discover Canada: Canadian Symbols",
  },
  {
    countryCode: "ca",
    versions: ["discover-canada"],
    chapterSlug: "who-we-are",
    type: "single",
    prompt: "What are Canada's two official languages?",
    options: [
      { id: "a", text: "English and French" },
      { id: "b", text: "English and Spanish" },
      { id: "c", text: "French and German" },
      { id: "d", text: "English and Mandarin" },
    ],
    correctOptionIds: ["a"],
    sourceRef: "Discover Canada: Who We Are",
  },
  // Australia (values-tagged)
  {
    countryCode: "au",
    versions: ["our-common-bond"],
    chapterSlug: "australian-values",
    type: "truefalse",
    prompt: "In Australia, people are free to practise any religion, or no religion.",
    options: tf,
    correctOptionIds: ["true"],
    tags: ["values"],
    sourceRef: "Our Common Bond: Australian values",
  },
  {
    countryCode: "au",
    versions: ["our-common-bond"],
    chapterSlug: "australian-values",
    type: "truefalse",
    prompt: "In Australia, men and women have equal rights.",
    options: tf,
    correctOptionIds: ["true"],
    tags: ["values"],
    sourceRef: "Our Common Bond: Australian values",
  },
  {
    countryCode: "au",
    versions: ["our-common-bond"],
    chapterSlug: "australia-and-its-people",
    type: "single",
    prompt: "What is the capital city of Australia?",
    options: [
      { id: "a", text: "Sydney" },
      { id: "b", text: "Melbourne" },
      { id: "c", text: "Canberra" },
      { id: "d", text: "Perth" },
    ],
    correctOptionIds: ["c"],
    sourceRef: "Our Common Bond: Australia and its people",
  },
  {
    countryCode: "au",
    versions: ["our-common-bond"],
    chapterSlug: "australia-and-its-people",
    type: "single",
    prompt: "In which year did the Australian colonies federate?",
    options: [
      { id: "a", text: "1788" },
      { id: "b", text: "1901" },
      { id: "c", text: "1945" },
      { id: "d", text: "1967" },
    ],
    correctOptionIds: ["b"],
    sourceRef: "Our Common Bond: Australia and its people",
  },
];
