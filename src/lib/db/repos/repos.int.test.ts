// @vitest-environment node
import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import "@/lib/db/models";
import { clearTestDb, startTestDb, stopTestDb } from "@/lib/db/test-utils";
import { attemptsRepo } from "./attempts";
import { countriesRepo } from "./countries";
import { postsRepo } from "./posts";
import { questionsRepo } from "./questions";
import { testsRepo } from "./tests";

beforeAll(startTestDb, 180_000);
afterAll(stopTestDb);
beforeEach(clearTestDb);

const ukConfig = {
  versions: [
    {
      key: "uk",
      questionsAsked: 24,
      poolSize: 100,
      passRule: { type: "percent" as const, value: 75 },
      stopWhenPassed: false,
      timeLimitSec: 2700,
    },
  ],
  activeVersion: "uk",
};

describe("countriesRepo", () => {
  it("upserts and fetches a country, returning its active exam version", async () => {
    await countriesRepo.upsert({
      code: "uk",
      name: "United Kingdom",
      slug: "uk",
      examConfig: ukConfig,
      officialSourceUrl: "https://www.gov.uk/life-in-the-uk-test",
    });
    await countriesRepo.upsert({
      code: "uk",
      name: "United Kingdom",
      slug: "uk",
      examConfig: ukConfig,
      officialSourceUrl: "https://www.gov.uk/life-in-the-uk-test",
    });
    expect(await countriesRepo.list()).toHaveLength(1);
    const version = await countriesRepo.getActiveVersion("uk");
    expect(version.questionsAsked).toBe(24);
  });
  it("rejects an invalid exam config", async () => {
    await expect(
      countriesRepo.upsert({
        code: "uk",
        name: "UK",
        slug: "uk",
        examConfig: { versions: [], activeVersion: "x" },
        officialSourceUrl: "https://example.com",
      }),
    ).rejects.toThrow();
  });
  it("throws for an unknown country", async () => {
    await expect(countriesRepo.getActiveVersion("ca")).rejects.toThrow(/not found/i);
  });
});

describe("questionsRepo", () => {
  const base = {
    countryCode: "uk" as const,
    versions: ["uk"],
    chapterId: new mongoose.Types.ObjectId(),
    type: "single" as const,
    prompt: "Q?",
    options: [
      { id: "a", text: "A" },
      { id: "b", text: "B" },
    ],
    correctOptionIds: ["a"],
    explanation: "Because.",
    sourceRef: "Handbook",
    difficulty: 1,
  };
  it("only returns published questions for the country and version", async () => {
    await questionsRepo.create({ ...base, status: "published" });
    await questionsRepo.create({ ...base, status: "draft" });
    await questionsRepo.create({
      ...base,
      countryCode: "ca",
      versions: ["ca"],
      status: "published",
    });
    const found = await questionsRepo.findPublished({ countryCode: "uk", version: "uk" });
    expect(found).toHaveLength(1);
    expect(found[0].id).toEqual(expect.any(String));
  });
  it("filters by chapter and tag", async () => {
    const chapterId = new mongoose.Types.ObjectId();
    await questionsRepo.create({ ...base, chapterId, tags: ["values"], status: "published" });
    await questionsRepo.create({ ...base, status: "published" });
    expect(
      await questionsRepo.findPublished({ countryCode: "uk", chapterId: String(chapterId) }),
    ).toHaveLength(1);
    expect(await questionsRepo.findPublished({ countryCode: "uk", tag: "values" })).toHaveLength(1);
  });
  it("requires choices for choice questions", async () => {
    await expect(
      questionsRepo.create({ ...base, options: [], correctOptionIds: [], status: "published" }),
    ).rejects.toThrow();
  });
});

describe("postsRepo", () => {
  const post = {
    type: "blog" as const,
    title: "Hello",
    slug: "hello",
    body: "<p>x</p>",
    authorId: new mongoose.Types.ObjectId(),
  };
  it("enforces slug uniqueness per type, not globally", async () => {
    await postsRepo.create({ ...post, status: "published", publishedAt: new Date() });
    await expect(postsRepo.create({ ...post, status: "draft" })).rejects.toThrow(
      /duplicate|E11000/i,
    );
    await expect(
      postsRepo.create({ ...post, type: "guide", status: "draft" }),
    ).resolves.toBeTruthy();
  });
  it("hides scheduled posts before publishedAt and shows them after", async () => {
    const publishAt = new Date("2026-06-01T00:00:00Z");
    await postsRepo.create({ ...post, status: "scheduled", publishedAt: publishAt });
    expect(
      await postsRepo.findPublishedBySlug("blog", "hello", new Date("2026-05-31T23:59:59Z")),
    ).toBeNull();
    expect(
      await postsRepo.findPublishedBySlug("blog", "hello", new Date("2026-06-01T00:00:01Z")),
    ).not.toBeNull();
  });
  it("never exposes drafts", async () => {
    await postsRepo.create({ ...post, status: "draft" });
    expect(await postsRepo.findPublishedBySlug("blog", "hello")).toBeNull();
    expect(await postsRepo.listPublished("blog")).toHaveLength(0);
  });
  it("lists published posts newest first", async () => {
    await postsRepo.create({
      ...post,
      slug: "old",
      status: "published",
      publishedAt: new Date("2026-01-01"),
    });
    await postsRepo.create({
      ...post,
      slug: "new",
      status: "published",
      publishedAt: new Date("2026-02-01"),
    });
    const list = await postsRepo.listPublished("blog", new Date("2026-03-01"));
    expect(list.map((p) => p.slug)).toEqual(["new", "old"]);
  });
});

describe("testsRepo", () => {
  it("enforces unique slugs and only lists published tests", async () => {
    const t = {
      title: "UK Mock 1",
      slug: "uk-mock-1",
      countryCode: "uk" as const,
      kind: "mock" as const,
    };
    await testsRepo.create({ ...t, isPublished: true });
    await expect(testsRepo.create({ ...t, isPublished: true })).rejects.toThrow(
      /duplicate|E11000/i,
    );
    await testsRepo.create({ ...t, slug: "hidden", isPublished: false });
    expect((await testsRepo.listPublished("uk")).map((x) => x.slug)).toEqual(["uk-mock-1"]);
    expect(await testsRepo.findPublishedBySlug("hidden")).toBeNull();
  });
});

describe("attemptsRepo", () => {
  it("lists a user's attempts newest first", async () => {
    const userId = new mongoose.Types.ObjectId();
    const testId = new mongoose.Types.ObjectId();
    const mk = (finishedAt: Date, score: number) => ({
      userId,
      testId,
      countryCode: "uk" as const,
      seed: "s",
      answers: [],
      score,
      passed: score >= 18,
      startedAt: new Date(finishedAt.getTime() - 1000),
      finishedAt,
      mode: "read" as const,
    });
    await attemptsRepo.create(mk(new Date("2026-01-01"), 10));
    await attemptsRepo.create(mk(new Date("2026-02-01"), 20));
    const list = await attemptsRepo.listForUser(String(userId));
    expect(list.map((a) => a.score)).toEqual([20, 10]);
  });
});
