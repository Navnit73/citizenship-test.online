// @vitest-environment node
import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import "@/lib/db/models";
import { PostModel, QuestionModel, TestModel } from "@/lib/db/models";
import { seedDatabase } from "@/lib/db/seed";
import { clearTestDb, startTestDb, stopTestDb } from "@/lib/db/test-utils";

vi.mock("next/cache", () => ({ cacheTag: vi.fn(), cacheLife: vi.fn() }));

import {
  getCountryData,
  getCountryQuestions,
  getCountrySummaries,
  getHomeData,
  getPostBySlug,
  getPostList,
  getRelatedPosts,
  getSlotPost,
  getTestBySlug,
  getTestList,
} from "./data";

beforeAll(startTestDb, 180_000);
afterAll(stopTestDb);
beforeEach(async () => {
  await clearTestDb();
  await seedDatabase();
});

const author = new mongoose.Types.ObjectId();
const post = (over: Record<string, unknown>) =>
  PostModel.create({
    type: "guide",
    title: "T",
    slug: "t",
    body: "<p>Body</p>",
    authorId: author,
    status: "published",
    publishedAt: new Date("2026-01-01"),
    ...over,
  });

describe("getCountrySummaries", () => {
  it("returns all four countries with rules derived from the database", async () => {
    const list = await getCountrySummaries();
    expect(list.map((c) => c.code)).toEqual(["us", "uk", "ca", "au"]);
    const uk = list.find((c) => c.code === "uk")!;
    expect(uk).toMatchObject({ name: "United Kingdom", testName: "Life in the UK Test" });
    expect(uk.description.passMark).toBe("75% (18 of 24)");
    expect(uk.description.time).toBe("45 minutes");
  });
});

describe("getCountryData", () => {
  it("returns the summary, chapters with question counts and the total", async () => {
    const data = await getCountryData("uk");
    expect(data.summary.code).toBe("uk");
    expect(data.chapters.length).toBeGreaterThan(0);
    expect(data.chapters.reduce((n, c) => n + c.questionCount, 0)).toBe(data.questionCount);
    expect(data.questionCount).toBeGreaterThan(0);
  });
  it("only counts published questions", async () => {
    const before = (await getCountryData("ca")).questionCount;
    await QuestionModel.updateOne({ countryCode: "ca" }, { status: "draft" });
    expect((await getCountryData("ca")).questionCount).toBe(before - 1);
  });
  it("throws for an unknown country", async () => {
    await CountryGone();
    await expect(getCountryData("uk")).rejects.toThrow(/not found/i);
  });
});
async function CountryGone() {
  const { CountryModel } = await import("@/lib/db/models");
  await CountryModel.deleteMany({ code: "uk" });
}

describe("getCountryQuestions", () => {
  it("groups answerable published questions by chapter with readable answers", async () => {
    const data = await getCountryQuestions("uk");
    const all = data.chapters.flatMap((c) => c.questions);
    expect(all.length).toBeGreaterThan(0);
    const hastings = all.find((q) => /Hastings/.test(q.prompt))!;
    expect(hastings.answer).toBe("1066");
    expect(hastings.sourceRef).toBeTruthy();
  });
  it("joins multiple correct options", async () => {
    const all = (await getCountryQuestions("uk")).chapters.flatMap((c) => c.questions);
    expect(all.find((q) => /TWO of these/.test(q.prompt))!.answer).toBe("Wales, Scotland");
  });
  it("omits questions without a fixed answer (state-specific) and drafts", async () => {
    const us = (await getCountryQuestions("us")).chapters.flatMap((c) => c.questions);
    expect(us.some((q) => /Governor/.test(q.prompt))).toBe(false);
    await QuestionModel.updateMany({ countryCode: "us" }, { status: "draft" });
    expect((await getCountryQuestions("us")).chapters).toHaveLength(0);
  });
});

describe("getSlotPost", () => {
  it("returns null until a page with the conventional slug is published", async () => {
    expect(await getSlotPost("uk", "study-guide")).toBeNull();
    await post({
      type: "page",
      slug: "uk-study-guide",
      title: "UK study guide",
      body: "<p>Hi</p><script>x()</script>",
      status: "draft",
    });
    expect(await getSlotPost("uk", "study-guide")).toBeNull();
    await PostModel.updateOne({ slug: "uk-study-guide" }, { status: "published" });
    const slot = await getSlotPost("uk", "study-guide");
    expect(slot).toMatchObject({ title: "UK study guide", body: "<p>Hi</p>" });
  });
});

describe("getRelatedPosts", () => {
  it("returns published, non-page posts tagged with the country", async () => {
    await post({ slug: "a", countryCode: "uk" });
    await post({ slug: "b", countryCode: "us" });
    await post({ slug: "c", countryCode: "uk", status: "draft" });
    await post({ slug: "d", countryCode: "uk", type: "page" });
    await post({
      slug: "e",
      countryCode: "uk",
      status: "scheduled",
      publishedAt: new Date(Date.now() + 1e9),
    });
    const related = await getRelatedPosts("uk");
    expect(related.map((p) => p.slug)).toEqual(["a"]);
    expect(related[0].path).toBe("/guides/a");
  });
});

describe("getHomeData", () => {
  it("returns countries, latest posts (max 6), published tests and stats", async () => {
    for (let i = 0; i < 8; i++)
      await post({
        slug: `p${i}`,
        type: i % 2 ? "blog" : "guide",
        publishedAt: new Date(2026, 0, i + 1),
      });
    await TestModel.create({
      title: "Pub",
      slug: "pub",
      countryCode: "uk",
      kind: "mock",
      isPublished: true,
    });
    await TestModel.create({
      title: "Hidden",
      slug: "hid",
      countryCode: "uk",
      kind: "mock",
      isPublished: false,
    });
    const home = await getHomeData();
    expect(home.countries).toHaveLength(4);
    expect(home.latestPosts).toHaveLength(6);
    expect(home.latestPosts[0].slug).toBe("p7");
    expect(home.tests.map((t) => t.slug)).toEqual(["pub"]);
    expect(home.stats.questions).toBeGreaterThan(0);
    expect(home.stats.tests).toBe(1);
  });
});

describe("public post and test reads", () => {
  it("getPostBySlug returns sanitised, serialisable published content only", async () => {
    await post({
      slug: "hello",
      title: "Hello",
      body: "<p>Hi</p><script>x()</script>",
      excerpt: "Ex",
      countryCode: "uk",
      seo: { title: "S", noindex: true },
    });
    const p = (await getPostBySlug("guide", "hello"))!;
    expect(p).toMatchObject({
      title: "Hello",
      body: "<p>Hi</p>",
      excerpt: "Ex",
      countryCode: "uk",
      seo: { title: "S", noindex: true },
    });
    expect(typeof p.publishedAt).toBe("string");
    expect(await getPostBySlug("blog", "hello")).toBeNull();
    await post({ slug: "draft-one", status: "draft" });
    expect(await getPostBySlug("guide", "draft-one")).toBeNull();
  });
  it("getPostList lists published posts of a type, newest first, with paths", async () => {
    await post({ slug: "old", publishedAt: new Date("2026-01-01") });
    await post({ slug: "new", publishedAt: new Date("2026-02-01") });
    await post({ slug: "other", type: "blog" });
    const list = await getPostList("guide");
    expect(list.map((p) => p.slug)).toEqual(["new", "old"]);
    expect(list[0].path).toBe("/guides/new");
  });
  it("getTestList and getTestBySlug expose only published tests", async () => {
    await TestModel.create({
      title: "Pub",
      slug: "pub",
      countryCode: "uk",
      kind: "mock",
      isPublished: true,
      seo: { title: "S", description: "D" },
    });
    await TestModel.create({
      title: "Hid",
      slug: "hid",
      countryCode: "uk",
      kind: "mock",
      isPublished: false,
    });
    expect((await getTestList()).map((t) => t.slug)).toEqual(["pub"]);
    expect(await getTestBySlug("pub")).toMatchObject({
      title: "Pub",
      countryCode: "uk",
      seo: { title: "S", description: "D" },
    });
    expect(await getTestBySlug("hid")).toBeNull();
  });
});
