import { describe, expect, it } from "vitest";
import { canonicalHostRedirect } from "./url";

const SITE = "https://citizenship-test.example";

describe("canonicalHostRedirect", () => {
  it("sends the www twin to the canonical host, keeping path and query", () => {
    const out = canonicalHostRedirect(
      new URL("https://www.citizenship-test.example/uk/practice-test?x=1"),
      SITE,
    );
    expect(out?.toString()).toBe("https://citizenship-test.example/uk/practice-test?x=1");
  });
  it("works the other way round when the canonical host is www", () => {
    const out = canonicalHostRedirect(
      new URL("https://citizenship-test.example/a"),
      "https://www.citizenship-test.example",
    );
    expect(out?.toString()).toBe("https://www.citizenship-test.example/a");
  });
  it("leaves the canonical host and unrelated hosts alone", () => {
    expect(canonicalHostRedirect(new URL(`${SITE}/a`), SITE)).toBeNull();
    expect(canonicalHostRedirect(new URL("https://preview-123.vercel.app/a"), SITE)).toBeNull();
    expect(canonicalHostRedirect(new URL("http://localhost:3000/a"), SITE)).toBeNull();
  });
});
