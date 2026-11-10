import { describe, expect, it } from "vitest";
import { can, isStaff } from "./permissions";

describe("permissions", () => {
  it("admin can do everything", () => {
    for (const p of ["user:manage", "audit:read", "post:publish", "question:write"] as const) {
      expect(can("admin", p)).toBe(true);
    }
  });
  it("editor manages content but not users or audit logs", () => {
    expect(can("editor", "post:publish")).toBe(true);
    expect(can("editor", "question:write")).toBe(true);
    expect(can("editor", "redirect:write")).toBe(true);
    expect(can("editor", "user:manage")).toBe(false);
    expect(can("editor", "audit:read")).toBe(false);
  });
  it("author can write own posts but not publish or touch others'", () => {
    expect(can("author", "admin:access")).toBe(true);
    expect(can("author", "post:write-own")).toBe(true);
    expect(can("author", "post:publish")).toBe(false);
    expect(can("author", "post:write-any")).toBe(false);
    expect(can("author", "question:write")).toBe(false);
  });
  it("plain users and anonymous have no admin rights", () => {
    expect(can("user", "admin:access")).toBe(false);
    expect(can(undefined, "admin:access")).toBe(false);
    expect(isStaff("user")).toBe(false);
    expect(isStaff("author")).toBe(true);
  });
});
