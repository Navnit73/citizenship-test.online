// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import "@/lib/db/models";
import { seedDatabase } from "@/lib/db/seed";
import { startTestDb, stopTestDb } from "@/lib/db/test-utils";
import { GET } from "./[country]/route";

beforeAll(async () => {
  await startTestDb();
  await seedDatabase();
}, 180_000);
afterAll(stopTestDb);

const call = (country: string, qs = "") =>
  GET(new Request(`http://x/api/exams/${country}${qs}`), { params: Promise.resolve({ country }) });

describe("GET /api/exams/[country]", () => {
  it("returns an exam for a valid country", async () => {
    const res = await call("au", "?seed=abc");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.seed).toBe("abc");
    expect(body.version.requiredTags[0].tag).toBe("values");
  });
  it("generates a seed when none is given", async () => {
    const body = await (await call("ca")).json();
    expect(body.seed).toEqual(expect.any(String));
  });
  it("400s for an unknown country", async () => {
    expect((await call("fr")).status).toBe(400);
  });
  it("400s for an unknown version", async () => {
    expect((await call("us", "?version=1999")).status).toBe(400);
  });
});
