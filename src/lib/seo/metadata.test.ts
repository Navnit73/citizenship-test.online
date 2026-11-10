import { describe, expect, it } from "vitest";
import { buildMetadata, pageTitle, truncate } from "./metadata";

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

describe("pageTitle", () => {
  it("keeps the brand suffix only when the full title fits in ~60 characters", () => {
    expect(pageTitle("Blog")).toBe("Blog");
    const long = "Australian citizenship test: format, pass mark and practice";
    expect(pageTitle(long)).toEqual({ absolute: long });
  });
});

describe("buildMetadata social cards", () => {
  it("adds a large twitter card and article dates", () => {
    const m = buildMetadata({
      title: "x",
      path: "/blog/x",
      description: "d",
      type: "article",
      publishedTime: "2026-01-01T00:00:00.000Z",
    });
    expect(m.twitter).toMatchObject({ card: "summary_large_image", title: "x", description: "d" });
    expect(m.openGraph).toMatchObject({ publishedTime: "2026-01-01T00:00:00.000Z" });
  });
  it("caps descriptions at 160 characters", () => {
    const m = buildMetadata({ title: "x", path: "/x", description: "word ".repeat(60) });
    expect((m.description as string).length).toBeLessThanOrEqual(160);
  });
});
