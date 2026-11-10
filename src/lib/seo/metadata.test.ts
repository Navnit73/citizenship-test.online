import { describe, expect, it } from "vitest";
import { buildMetadata, truncate } from "./metadata";

describe("truncate", () => {
  it("leaves short text and cuts long text on a word boundary", () => {
    expect(truncate("short", 20)).toBe("short");
    const out = truncate("one two three four five six seven", 15);
    expect(out.length).toBeLessThanOrEqual(15);
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toMatch(/\s…$/);
  });
});

describe("buildMetadata", () => {
  it("sets title, description, canonical and open graph", () => {
    const m = buildMetadata({
      title: "UK test",
      description: "Practice.",
      path: "/uk/practice-test",
    });
    expect(m.title).toBe("UK test");
    expect(m.alternates?.canonical).toBe("/uk/practice-test");
    expect(m.openGraph).toMatchObject({
      title: "UK test",
      description: "Practice.",
      url: "/uk/practice-test",
      type: "website",
    });
  });
  it("marks noindex pages", () => {
    expect(buildMetadata({ title: "x", path: "/x", noindex: true }).robots).toEqual({
      index: false,
      follow: true,
    });
    expect(buildMetadata({ title: "x", path: "/x" }).robots).toBeUndefined();
  });
  it("supports article type", () => {
    expect(buildMetadata({ title: "x", path: "/x", type: "article" }).openGraph).toMatchObject({
      type: "article",
    });
  });
});
