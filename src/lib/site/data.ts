/**
 * Cached, serialisable reads for public pages. Every function is tagged so CMS
 * writes can refresh it immediately (see `invalidate` in the admin routes).
 * Callers must `await connection()` first so nothing runs at build time.
 */
import { cacheLife, cacheTag } from "next/cache";
import { COUNTRY_CODES, COUNTRY_NAMES } from "@/lib/countries";
import { connectDb } from "@/lib/db/connect";
import { ChapterModel, CountryModel, PostModel, QuestionModel } from "@/lib/db/models";
import { postsRepo } from "@/lib/db/repos/posts";
import { testsRepo } from "@/lib/db/repos/tests";
import { postPath, type PublicPostType } from "@/lib/cms/paths";
import { sanitizeRichText } from "@/lib/cms/sanitize";
import { examConfigSchema } from "@/lib/engine/schemas";
import type { CountryCode, ExamVersion } from "@/lib/engine/types";
import { describeExam, type ExamDescription } from "./exam-describe";
import { hubPage } from "./country-pages";

const iso = (d?: Date | null) => (d ? new Date(d).toISOString() : null);

export type CountrySummary = {
  code: CountryCode;
  name: string;
  testName: string;
  version: ExamVersion;
  description: ExamDescription;
  officialSourceUrl: string;
  lastReviewedAt: string | null;
};

async function loadSummaries(): Promise<CountrySummary[]> {
  await connectDb();
  const docs = await CountryModel.find();
  return COUNTRY_CODES.flatMap((code) => {
    const doc = docs.find((d) => d.code === code);
    if (!doc) return [];
    const config = examConfigSchema.parse(doc.examConfig);
    const version = config.versions.find((v) => v.key === config.activeVersion)!;
    return [
      {
        code,
        name: COUNTRY_NAMES[code],
        testName: hubPage(code).label,
        version,
        description: describeExam(version),
        officialSourceUrl: doc.officialSourceUrl,
        lastReviewedAt: iso(doc.lastReviewedAt),
      },
    ];
  });
}

export async function getCountrySummaries(): Promise<CountrySummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("countries");
  return loadSummaries();
}

export type CountryData = {
  summary: CountrySummary;
  chapters: { title: string; slug: string; questionCount: number }[];
  questionCount: number;
};

export async function getCountryData(code: CountryCode): Promise<CountryData> {
  "use cache";
  cacheLife("hours");
  cacheTag("countries", "questions");
  const summary = (await loadSummaries()).find((c) => c.code === code);
  if (!summary) throw new Error(`Country ${code} not found`);
  const [chapters, counts] = await Promise.all([
    ChapterModel.find({ countryCode: code }).sort({ order: 1 }),
    QuestionModel.aggregate<{ _id: unknown; n: number }>([
      { $match: { countryCode: code, status: "published", versions: summary.version.key } },
      { $group: { _id: "$chapterId", n: { $sum: 1 } } },
    ]),
  ]);
  const byChapter = new Map(counts.map((c) => [String(c._id), c.n]));
  const rows = chapters.map((c) => ({
    title: c.title,
    slug: c.slug,
    questionCount: byChapter.get(String(c._id)) ?? 0,
  }));
  return { summary, chapters: rows, questionCount: rows.reduce((n, c) => n + c.questionCount, 0) };
}

export type BankQuestion = {
  id: string;
  prompt: string;
  type: string;
  answer: string;
  explanation?: string;
  sourceRef: string;
  tags: string[];
};

export async function getCountryQuestions(
  code: CountryCode,
): Promise<{ chapters: { title: string; slug: string; questions: BankQuestion[] }[] }> {
  "use cache";
  cacheLife("hours");
  cacheTag("countries", "questions");
  const summary = (await loadSummaries()).find((c) => c.code === code);
  if (!summary) throw new Error(`Country ${code} not found`);
  const [chapters, questions] = await Promise.all([
    ChapterModel.find({ countryCode: code }).sort({ order: 1 }),
    QuestionModel.find({
      countryCode: code,
      status: "published",
      versions: summary.version.key,
    }).sort({ createdAt: 1 }),
  ]);
  const out = chapters.map((c) => ({
    title: c.title,
    slug: c.slug,
    questions: [] as BankQuestion[],
  }));
  const index = new Map(chapters.map((c, i) => [String(c._id), i]));
  for (const q of questions) {
    const answer =
      q.type === "shorttext" || q.type === "dictation"
        ? q.acceptedAnswers.join(" / ")
        : q.correctOptionIds.map((id) => q.options.find((o) => o.id === id)?.text ?? id).join(", ");
    const slot = index.get(String(q.chapterId));
    if (!answer || slot === undefined) continue; // state-specific questions have no fixed answer
    out[slot].questions.push({
      id: String(q._id),
      prompt: q.prompt,
      type: q.type,
      answer,
      explanation: q.explanation ?? undefined,
      sourceRef: q.sourceRef,
      tags: q.tags,
    });
  }
  return { chapters: out.filter((c) => c.questions.length > 0) };
}

export type PostCard = {
  title: string;
  slug: string;
  type: PublicPostType;
  path: string;
  excerpt?: string;
  publishedAt: string | null;
};

type PostLike = {
  title: string;
  slug: string;
  type: string;
  excerpt?: string | null;
  publishedAt?: Date | null;
};
const toCard = (p: PostLike): PostCard => ({
  title: p.title,
  slug: p.slug,
  type: p.type as PublicPostType,
  path: postPath(p.type as PublicPostType, p.slug),
  excerpt: p.excerpt ?? undefined,
  publishedAt: iso(p.publishedAt),
});

const ARTICLE_TYPES = ["blog", "guide", "howto"] as const;
const visibleNow = () => ({
  status: { $in: ["published", "scheduled"] as ("published" | "scheduled")[] },
  publishedAt: { $lte: new Date() },
});

/** CMS-written body for a country page, stored as a `page` post with slug `{country}-{page}`. */
export async function getSlotPost(
  code: CountryCode,
  pageSlug: string,
): Promise<{ title: string; body: string; updatedAt: string | null } | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("posts");
  await connectDb();
  const p = await postsRepo.findPublishedBySlug("page", `${code}-${pageSlug}`);
  if (!p) return null;
  return {
    title: p.title,
    body: sanitizeRichText(p.body),
    updatedAt: iso((p as unknown as { updatedAt?: Date }).updatedAt),
  };
}

export async function getRelatedPosts(code: CountryCode): Promise<PostCard[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("posts");
  await connectDb();
  const posts = await PostModel.find({
    countryCode: code,
    type: { $in: ARTICLE_TYPES },
    ...visibleNow(),
  })
    .sort({ publishedAt: -1 })
    .limit(6);
  return posts.map(toCard);
}

export async function getHomeData() {
  "use cache";
  cacheLife("minutes");
  cacheTag("posts", "tests", "countries", "questions");
  await connectDb();
  const [countries, posts, tests, questions] = await Promise.all([
    loadSummaries(),
    PostModel.find({ type: { $in: ARTICLE_TYPES }, ...visibleNow() })
      .sort({ publishedAt: -1 })
      .limit(6),
    testsRepo.listPublished(),
    QuestionModel.countDocuments({ status: "published" }),
  ]);
  return {
    countries,
    latestPosts: posts.map(toCard),
    tests: tests
      .slice(0, 6)
      .map((t) => ({ title: t.title, slug: t.slug, countryCode: t.countryCode as CountryCode })),
    stats: { questions, tests: tests.length },
  };
}

// --- Single-post and listing reads used by /blog, /guides, /how-to, /legal, /p and /tests ---

export type PostPage = {
  title: string;
  slug: string;
  type: PublicPostType;
  countryCode?: CountryCode;
  excerpt?: string;
  body: string;
  publishedAt: string | null;
  updatedAt: string | null;
  seo?: { title?: string; description?: string; noindex?: boolean };
};

export async function getPostBySlug(type: PublicPostType, slug: string): Promise<PostPage | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("posts");
  await connectDb();
  const p = await postsRepo.findPublishedBySlug(type, slug);
  if (!p) return null;
  return {
    title: p.title,
    slug: p.slug,
    type,
    countryCode: (p.countryCode as CountryCode | undefined) ?? undefined,
    excerpt: p.excerpt ?? undefined,
    body: sanitizeRichText(p.body), // defence in depth: also sanitised on save
    publishedAt: iso(p.publishedAt),
    updatedAt: iso((p as unknown as { updatedAt?: Date }).updatedAt),
    seo: p.seo
      ? {
          title: p.seo.title ?? undefined,
          description: p.seo.description ?? undefined,
          noindex: p.seo.noindex ?? undefined,
        }
      : undefined,
  };
}

export async function getPostList(type: PublicPostType): Promise<PostCard[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("posts");
  await connectDb();
  return (await postsRepo.listPublished(type)).map(toCard);
}

export async function getTestList() {
  "use cache";
  cacheLife("minutes");
  cacheTag("tests");
  await connectDb();
  return (await testsRepo.listPublished()).map((t) => ({
    title: t.title,
    slug: t.slug,
    countryCode: t.countryCode,
    kind: t.kind,
  }));
}

export async function getTestBySlug(slug: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("tests");
  await connectDb();
  const t = await testsRepo.findPublishedBySlug(slug);
  if (!t) return null;
  return {
    title: t.title,
    slug: t.slug,
    countryCode: t.countryCode,
    seo: t.seo
      ? {
          title: t.seo.title ?? undefined,
          description: t.seo.description ?? undefined,
          noindex: t.seo.noindex ?? undefined,
        }
      : undefined,
  };
}
