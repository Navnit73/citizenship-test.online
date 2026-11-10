import { ChapterModel, QuestionModel, TestModel } from "@/lib/db/models";
import { countriesRepo } from "@/lib/db/repos/countries";
import { questionsRepo } from "@/lib/db/repos/questions";
import { NotFoundError } from "@/lib/cms/errors";
import { testRulesSchema } from "@/lib/cms/tests";
import { pickQuestions, seededShuffle } from "@/lib/engine/shuffle";
import type { SessionQuestion } from "@/lib/engine/session";
import type { CountryCode, ExamVersion } from "@/lib/engine/types";

export type ExamPayload = {
  countryCode: CountryCode;
  seed: string;
  version: ExamVersion;
  questions: SessionQuestion[];
};

export class ExamError extends Error {}

type QuestionDoc = Awaited<ReturnType<typeof questionsRepo.findPublished>>[number];

async function chapterTitles(countryCode: CountryCode) {
  const chapters = await ChapterModel.find({ countryCode });
  return new Map(chapters.map((c) => [String(c._id), c.title]));
}

/** Dictation and answer-less text questions can't be auto-graded in a civics-style exam. */
const isGradable = (q: QuestionDoc) =>
  q.type !== "dictation" && !(q.type === "shorttext" && q.acceptedAnswers.length === 0);

function toSessionQuestions(docs: QuestionDoc[], seed: string, titles: Map<string, string>) {
  return docs.filter(isGradable).map((q): SessionQuestion => {
    const options = q.options.map((o) => ({ id: o.id, text: o.text }));
    return {
      id: String(q._id),
      type: q.type,
      prompt: q.prompt,
      options: q.type === "truefalse" ? options : seededShuffle(options, `${seed}:${q._id}`),
      correctOptionIds: q.correctOptionIds,
      acceptedAnswers: q.acceptedAnswers,
      tags: q.tags,
      explanation: q.explanation ?? undefined,
      sourceRef: q.sourceRef,
      audioUrl: q.audioUrl ?? undefined,
      chapterTitle: titles.get(String(q.chapterId)) ?? "General",
    };
  });
}

/** Builds a seeded mock exam from published, gradable questions using the country's exam rules. */
export async function buildExam(
  countryCode: CountryCode,
  seed: string,
  versionKey?: string,
): Promise<ExamPayload> {
  let version: ExamVersion;
  try {
    version = await countriesRepo.getVersion(countryCode, versionKey);
  } catch (err) {
    if (err instanceof Error && /Unknown version/.test(err.message))
      throw new ExamError(err.message);
    throw err;
  }
  const [docs, titles] = await Promise.all([
    questionsRepo.findPublished({ countryCode, version: version.key }),
    chapterTitles(countryCode),
  ]);
  const pool = toSessionQuestions(docs, seed, titles);
  return {
    countryCode,
    seed,
    version,
    questions: pickQuestions(pool, version.questionsAsked, seed),
  };
}

/** Builds the exam for an admin-published Test (mock, chapter or custom). */
export async function buildTestExam(slug: string, seed: string): Promise<ExamPayload> {
  const test = await TestModel.findOne({ slug, isPublished: true });
  if (!test) throw new NotFoundError("Test not found");
  const countryCode = test.countryCode as CountryCode;

  if (test.kind === "mock") {
    const exam = await buildExam(countryCode, seed);
    return test.timeLimitSec
      ? { ...exam, version: { ...exam.version, timeLimitSec: test.timeLimitSec } }
      : exam;
  }

  const rules = testRulesSchema.parse(test.rules ?? {});
  const filter =
    test.kind === "custom"
      ? { _id: { $in: test.questionIds }, status: "published" as const }
      : { countryCode, chapterId: { $in: rules.chapterIds ?? [] }, status: "published" as const };
  const [docs, titles] = await Promise.all([
    QuestionModel.find(filter),
    chapterTitles(countryCode),
  ]);
  const pool = toSessionQuestions(docs as QuestionDoc[], seed, titles);
  const version: ExamVersion = {
    key: `test:${slug}`,
    questionsAsked: Math.min(rules.questionsAsked ?? pool.length, pool.length),
    poolSize: pool.length,
    passRule: rules.passRule ?? { type: "percent", value: 75 },
    stopWhenPassed: false,
    timeLimitSec: test.timeLimitSec ?? undefined,
  };
  return {
    countryCode,
    seed,
    version,
    questions: pickQuestions(pool, version.questionsAsked, seed),
  };
}
