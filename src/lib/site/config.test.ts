import { describe, expect, it } from "vitest";
import { isIndexable } from "./config";

describe("isIndexable", () => {
  const prod = { SITE_URL: "https://citizenship-test.example" };
  it("allows a real production origin", () => {
    expect(isIndexable(prod)).toBe(true);
    expect(isIndexable({ ...prod, VERCEL_ENV: "production" })).toBe(true);
  });
  it("blocks localhost, previews and explicit NOINDEX", () => {
    expect(isIndexable({})).toBe(false);
    expect(isIndexable({ SITE_URL: "http://localhost:3000" })).toBe(false);
    expect(isIndexable({ SITE_URL: "http://127.0.0.1:3000/" })).toBe(false);
    expect(isIndexable({ ...prod, VERCEL_ENV: "preview" })).toBe(false);
    expect(isIndexable({ ...prod, NOINDEX: "true" })).toBe(false);
  });
  it("can be forced on for local end-to-end checks, but NOINDEX still wins", () => {
    expect(isIndexable({ ALLOW_INDEXING: "true" })).toBe(true);
    expect(isIndexable({ ALLOW_INDEXING: "true", NOINDEX: "true" })).toBe(false);
  });
});
