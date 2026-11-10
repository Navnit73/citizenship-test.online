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

  return {
    countries: countries.length,
    chapters: chapters.length,
    questions: questions.length,
  };
}
