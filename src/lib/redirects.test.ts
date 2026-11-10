import { describe, expect, it } from "vitest";
import { resolveRedirect } from "./redirects";

const map = [
  { from: "/old", to: "/new", status: 301 },
  { from: "/new", to: "/newer", status: 301 },
  { from: "/ext", to: "https://example.com/x", status: 302 },
];

describe("resolveRedirect", () => {
  it("returns null when nothing matches", () => {
    expect(resolveRedirect(map, "/nope")).toBeNull();
  });
  it("matches exact paths ignoring trailing slashes", () => {
    expect(resolveRedirect(map, "/ext/")).toEqual({ to: "https://example.com/x", status: 302 });
  });
  it("follows chains to the final destination", () => {
    expect(resolveRedirect(map, "/old")).toEqual({ to: "/newer", status: 301 });
  });
  it("is loop-safe", () => {
    const loop = [
      { from: "/a", to: "/b", status: 301 },
      { from: "/b", to: "/a", status: 301 },
    ];
    expect(resolveRedirect(loop, "/a")).toBeNull();
  });
});
