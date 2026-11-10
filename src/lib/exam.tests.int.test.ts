// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import "@/lib/db/models";
import { ChapterModel, QuestionModel, TestModel } from "@/lib/db/models";
import { seedDatabase } from "@/lib/db/seed";
import { clearTestDb, startTestDb, stopTestDb } from "@/lib/db/test-utils";
import { NotFoundError } from "@/lib/cms/errors";
import { buildTestExam } from "./exam";

beforeAll(startTestDb, 180_000);
afterAll(stopTestDb);
beforeEach(async () => {
  await clearTestDb();
  await seedDatabase();
});

async function ukQuestions() {
  return QuestionModel.find({ countryCode: "uk" });
}

describe("buildTestExam", () => {
  it("builds a custom test from hand-picked published questions with its own rules", async () => {
    const qs = await ukQuestions();
    await TestModel.create({
      title: "T",
      slug: "t",
      countryCode: "uk",
      kind: "custom",
      isPublished: true,
      questionIds: qs.slice(0, 2).map((q) => q._id),
      timeLimitSec: 120,
      rules: { passRule: { type: "count", value: 1 } },
    });
    const exam = await buildTestExam("t", "seed");
    expect(exam.questions).toHaveLength(2);
    expect(exam.version).toMatchObject({
      questionsAsked: 2,
      timeLimitSec: 120,
      passRule: { type: "count", value: 1 },
    });
  });
  it("skips draft questions", async () => {
    const qs = await ukQuestions();
    await QuestionModel.updateOne({ _id: qs[0]._id }, { status: "draft" });
    await TestModel.create({
      title: "T",
      slug: "t",
      countryCode: "uk",
      kind: "custom",
      isPublished: true,
      questionIds: [qs[0]._id, qs[1]._id],
    });
    expect((await buildTestExam("t", "s")).questions).toHaveLength(1);
  });
  it("builds a chapter test from the chapter's questions", async () => {
    const chapter = (await ChapterModel.findOne({ countryCode: "uk", slug: "history" }))!;
    await TestModel.create({
      title: "C",
      slug: "c",
      countryCode: "uk",
      kind: "chapter",
      isPublished: true,
      rules: { chapterIds: [String(chapter._id)] },
    });
    const exam = await buildTestExam("c", "s");
    expect(exam.questions.length).toBeGreaterThan(0);
    expect(exam.questions.every((q) => q.chapterTitle === chapter.title)).toBe(true);
  });
  it("builds a mock test from the country's exam rules, honouring a time override", async () => {
    await TestModel.create({
      title: "M",
      slug: "m",
      countryCode: "uk",
      kind: "mock",
      isPublished: true,
      timeLimitSec: 99,
    });
    const exam = await buildTestExam("m", "s");
    expect(exam.version.key).toBe("3rd-edition");
    expect(exam.version.timeLimitSec).toBe(99);
  });
  it("404s for unpublished or unknown tests", async () => {
    await TestModel.create({
      title: "U",
      slug: "u",
      countryCode: "uk",
      kind: "mock",
      isPublished: false,
    });
    await expect(buildTestExam("u", "s")).rejects.toBeInstanceOf(NotFoundError);
    await expect(buildTestExam("zzz", "s")).rejects.toBeInstanceOf(NotFoundError);
  });
});
