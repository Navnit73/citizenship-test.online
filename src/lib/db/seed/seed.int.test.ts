// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ChapterModel, CountryModel, QuestionModel } from "@/lib/db/models";
import { clearTestDb, startTestDb, stopTestDb } from "@/lib/db/test-utils";
import { countriesRepo } from "@/lib/db/repos/countries";
import { scoreAttempt } from "@/lib/engine";
import { seedDatabase } from "./index";

beforeAll(startTestDb, 180_000);
afterAll(stopTestDb);
beforeEach(clearTestDb);

describe("seedDatabase", () => {
  it("seeds all four countries with questions", async () => {
    const counts = await seedDatabase();
    expect(await CountryModel.countDocuments()).toBe(4);
    expect(await ChapterModel.countDocuments()).toBe(counts.chapters);
    for (const code of ["us", "uk", "ca", "au"]) {
      expect(
        await QuestionModel.countDocuments({ countryCode: code, status: "published" }),
      ).toBeGreaterThan(0);
    }
  });
  it("is idempotent", async () => {
    await seedDatabase();
    const before = await QuestionModel.countDocuments();
    await seedDatabase();
    expect(await QuestionModel.countDocuments()).toBe(before);
    expect(await CountryModel.countDocuments()).toBe(4);
  });
  it("stores exam rules in the DB that drive the engine", async () => {
    await seedDatabase();
    const au = await countriesRepo.getActiveVersion("au");
    const answers = Array.from({ length: 20 }, (_, i) => ({
      questionId: `q${i}`,
      correct: i !== 0,
      tags: i === 0 ? ["values"] : [],
    }));
    expect(scoreAttempt(au, answers).passed).toBe(false);
  });
  it("tags Australian values questions", async () => {
    await seedDatabase();
    expect(
      await QuestionModel.countDocuments({ countryCode: "au", tags: "values" }),
    ).toBeGreaterThan(0);
  });
});
