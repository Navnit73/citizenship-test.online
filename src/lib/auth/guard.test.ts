import { describe, expect, it } from "vitest";
import { guardAdminApi, guardPermission } from "./guard";

describe("guardAdminApi", () => {
  it("returns 403 for plain users and anonymous callers", () => {
    for (const role of ["user", undefined] as const) {
      expect(guardAdminApi(role)?.status).toBe(403);
    }
  });
  it("allows staff roles", () => {
    for (const role of ["admin", "editor", "author"] as const) {
      expect(guardAdminApi(role)).toBeNull();
    }
  });
});

describe("guardPermission", () => {
  it("returns 403 when the role lacks the permission", () => {
    expect(guardPermission("editor", "user:manage")?.status).toBe(403);
    expect(guardPermission("author", "post:publish")?.status).toBe(403);
  });
  it("returns null when allowed", () => {
    expect(guardPermission("admin", "user:manage")).toBeNull();
  });
});
