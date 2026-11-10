// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import "@/lib/db/models";
import { QuestionModel } from "@/lib/db/models";
import { seedDatabase } from "@/lib/db/seed";
import { clearTestDb, startTestDb, stopTestDb } from "@/lib/db/test-utils";
import { buildExam } from "./exam";

beforeAll(startTestDb, 180_000);
afterAll(stopTestDb);
beforeEach(async () => {
  await clearTestDb();
  await seedDatabase();
});

describe("buildExam", () => {
  it("returns the active exam version and published questions with chapter titles", async () => {
    const exam = await buildExam("uk", "seed-1");
    expect(exam.countryCode).toBe("uk");
    expect(exam.version.key).toBe("3rd-edition");
    expect(exam.questions.length).toBeGreaterThan(0);
    expect(exam.questions[0].chapterTitle).toEqual(expect.any(String));
    expect(exam.questions[0].id).toEqual(expect.any(String));
  });
  it("is deterministic for a seed and varies across seeds", async () => {
    const a = await buildExam("uk", "same");
    const b = await buildExam("uk", "same");
    expect(a.questions.map((q) => q.id)).toEqual(b.questions.map((q) => q.id));
    const orders = new Set<string>();
    for (const seed of ["1", "2", "3", "4", "5", "6"]) {
      orders.add((await buildExam("uk", seed)).questions.map((q) => q.id).join());
    }
    expect(orders.size).toBeGreaterThan(1);
  });
  it("never includes dictation or ungradable questions", async () => {
    const chapter = (await QuestionModel.findOne({ countryCode: "us" }))!.chapterId;
    await QuestionModel.create({
      countryCode: "us",
      versions: ["2025"],
      chapterId: chapter,
      type: "dictation",
      prompt: "Write this",
      acceptedAnswers: ["x"],
      sourceRef: "r",
      status: "published",
    });
    const exam = await buildExam("us", "s");
    expect(exam.questions.some((q) => q.type === "dictation")).toBe(false);
    expect(
      exam.questions.some((q) => q.type === "shorttext" && q.acceptedAnswers.length === 0),
    ).toBe(false);
  });
  it("never includes draft questions", async () => {
    await QuestionModel.updateMany({ countryCode: "ca" }, { status: "draft" });
    expect((await buildExam("ca", "s")).questions).toHaveLength(0);
  });
  it("respects the version selection for the US", async () => {
    const exam = await buildExam("us", "s", "2008");
    expect(exam.version.key).toBe("2008");
  });
  it("throws for an unknown version", async () => {
    await expect(buildExam("us", "s", "1999")).rejects.toThrow(/version/i);
  });
});
