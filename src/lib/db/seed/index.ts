import { ChapterModel, QuestionModel } from "../models";
import { countriesRepo } from "../repos/countries";
import { chapters, countries, questions } from "./data";

/** Idempotent: safe to run repeatedly. Returns counts for logging. */
export async function seedDatabase() {
  for (const c of countries) await countriesRepo.upsert({ ...c, lastReviewedAt: new Date() });

  const chapterIds = new Map<string, unknown>();
  for (const ch of chapters) {
    const doc = await ChapterModel.findOneAndUpdate(
      { countryCode: ch.countryCode, slug: ch.slug },
      ch,
      { upsert: true, returnDocument: "after" },
    );
    chapterIds.set(`${ch.countryCode}/${ch.slug}`, doc!._id);
  }

  for (const { chapterSlug, ...q } of questions) {
    const chapterId = chapterIds.get(`${q.countryCode}/${chapterSlug}`);
    if (!chapterId) throw new Error(`Unknown chapter ${q.countryCode}/${chapterSlug}`);
    await QuestionModel.findOneAndUpdate(
      { countryCode: q.countryCode, prompt: q.prompt },
      { ...q, chapterId, status: "published" },
      { upsert: true, returnDocument: "after", runValidators: true },
    );
  }

  await removeRetiredSamples();

  return {
    countries: countries.length,
    chapters: chapters.length,
    questions: questions.length,
  };
}

/**
 * Early builds seeded placeholder US questions and two broad chapters. Prompts that match an
 * official question were updated in place above; drop the rest, and the chapters once empty.
 * Only touches rows those old seeds created, never admin-authored content.
 */
async function removeRetiredSamples() {
  const prompts = questions.filter((q) => q.countryCode === "us").map((q) => q.prompt);
  await QuestionModel.deleteMany({
    countryCode: "us",
    sourceRef: "USCIS civics test study materials",
    prompt: { $nin: prompts },
  });
  for (const slug of ["american-government", "american-history"]) {
    const chapter = await ChapterModel.findOne({ countryCode: "us", slug });
    if (chapter && !(await QuestionModel.exists({ chapterId: chapter._id })))
      await chapter.deleteOne();
  }
}
