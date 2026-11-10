// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import "@/lib/db/models";
import { RedirectModel, TestModel } from "@/lib/db/models";
import { seedDatabase } from "@/lib/db/seed";
import { clearTestDb, startTestDb, stopTestDb } from "@/lib/db/test-utils";

vi.mock("next/cache", () => ({ cacheTag: vi.fn(), cacheLife: vi.fn() }));
vi.mock("next/server", () => ({ connection: vi.fn() }));
import { GET as redirectsGET } from "./redirects/route";
import { GET as testGET } from "./tests/[slug]/route";

beforeAll(startTestDb, 180_000);
afterAll(stopTestDb);
beforeEach(async () => {
  await clearTestDb();
  await seedDatabase();
});

describe("GET /api/redirects", () => {
  it("returns the public redirect map", async () => {
    await RedirectModel.create({ from: "/a", to: "/b", status: 301 });
    const res = await redirectsGET();
    expect(await res.json()).toEqual([{ from: "/a", to: "/b", status: 301 }]);
  });
});

describe("GET /api/tests/[slug]", () => {
  const call = (slug: string, qs = "") =>
    testGET(new Request(`http://x/api/tests/${slug}${qs}`), { params: Promise.resolve({ slug }) });
  it("serves a published test", async () => {
    await TestModel.create({
      title: "M",
      slug: "m",
      countryCode: "uk",
      kind: "mock",
      isPublished: true,
    });
    const res = await call("m", "?seed=abc");
    expect(res.status).toBe(200);
    expect((await res.json()).seed).toBe("abc");
  });
  it("404s for unpublished tests and 400s for bad seeds", async () => {
    await TestModel.create({
      title: "U",
      slug: "u",
      countryCode: "uk",
      kind: "mock",
      isPublished: false,
    });
    expect((await call("u")).status).toBe(404);
    expect((await call("u", "?seed=bad seed!")).status).toBe(400);
  });
});
