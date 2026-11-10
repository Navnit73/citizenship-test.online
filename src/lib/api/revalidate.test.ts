import { afterEach, describe, expect, it, vi } from "vitest";

const { revalidateTag } = vi.hoisted(() => ({ revalidateTag: vi.fn() }));
vi.mock("next/cache", () => ({ revalidateTag }));

import { invalidate } from "./revalidate";

afterEach(() => revalidateTag.mockReset());

describe("invalidate", () => {
  it("expires the tag immediately", () => {
    invalidate("redirects");
    expect(revalidateTag).toHaveBeenCalledWith("redirects", { expire: 0 });
  });
  it("never throws, so a cache problem can't fail a successful write", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    revalidateTag.mockImplementation(() => {
      throw new Error("no static generation store");
    });
    expect(() => invalidate("posts")).not.toThrow();
    warn.mockRestore();
  });
});
