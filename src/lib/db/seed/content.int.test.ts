// @vitest-environment node
import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import "@/lib/db/models";
import { PostModel } from "@/lib/db/models";
import { clearTestDb, startTestDb, stopTestDb } from "@/lib/db/test-utils";
import { seedContent } from "./content";

beforeAll(startTestDb, 180_000);
afterAll(stopTestDb);
beforeEach(clearTestDb);

const author = String(new mongoose.Types.ObjectId());

describe("seedContent", () => {
  it("creates the starter legal pages as drafts", async () => {
    const result = await seedContent(author);
    expect(result.created.sort()).toEqual(["cookie-policy", "disclaimer", "editorial-policy"]);
    const posts = await PostModel.find({ type: "legal" });
    expect(posts).toHaveLength(3);
    expect(posts.every((p) => p.status === "draft")).toBe(true);
  });
  it("names the governments it is not affiliated with", async () => {
    await seedContent(author);
    const body = (await PostModel.findOne({ slug: "disclaimer" }))!.body;
    for (const name of ["USCIS", "Home Office", "IRCC", "Department of Home Affairs"]) {
      expect(body).toContain(name);
    }
  });
  it("describes the storage this site really uses", async () => {
    await seedContent(author);
    const body = (await PostModel.findOne({ slug: "cookie-policy" }))!.body;
    expect(body).toContain("ct.consent");
    expect(body).toMatch(/only .*after you accept/i);
  });
  it("is idempotent and never overwrites edits", async () => {
    await seedContent(author);
    await PostModel.updateOne(
      { slug: "disclaimer" },
      { body: "<p>Edited by a human</p>", status: "published", publishedAt: new Date() },
    );
    const again = await seedContent(author);
    expect(again.created).toEqual([]);
    expect(again.skipped).toHaveLength(3);
    expect((await PostModel.findOne({ slug: "disclaimer" }))!.body).toBe(
      "<p>Edited by a human</p>",
    );
  });
  it("can publish immediately (used for e2e and demos)", async () => {
    await seedContent(author, { publish: true });
    const posts = await PostModel.find({ type: "legal" });
    expect(posts.every((p) => p.status === "published" && p.publishedAt)).toBe(true);
  });
});
