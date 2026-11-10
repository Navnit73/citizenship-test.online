import { describe, expect, it } from "vitest";
import { postPath } from "./paths";

describe("postPath", () => {
  it("maps each post type to its public URL", () => {
    expect(postPath("blog", "a")).toBe("/blog/a");
    expect(postPath("guide", "a")).toBe("/guides/a");
    expect(postPath("howto", "a")).toBe("/how-to/a");
    expect(postPath("legal", "privacy-policy")).toBe("/legal/privacy-policy");
    expect(postPath("page", "about")).toBe("/p/about");
  });
});
