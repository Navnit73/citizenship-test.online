import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError, UnauthorizedError } from "@/lib/cms/errors";

const { auth } = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock("@/auth", () => ({ auth }));

import { requireActor } from "./session";

beforeEach(() => auth.mockReset());

describe("requireActor", () => {
  it("throws 401 without a session", async () => {
    auth.mockResolvedValue(null);
    await expect(requireActor("admin:access")).rejects.toBeInstanceOf(UnauthorizedError);
  });
  it("throws 401 for a session missing id or role", async () => {
    auth.mockResolvedValue({ user: { id: "u1" } });
    await expect(requireActor("admin:access")).rejects.toBeInstanceOf(UnauthorizedError);
  });
  it("throws 403 when the role lacks the permission", async () => {
    auth.mockResolvedValue({ user: { id: "u1", role: "author" } });
    await expect(requireActor("post:publish")).rejects.toBeInstanceOf(ForbiddenError);
  });
  it("returns the actor when allowed", async () => {
    auth.mockResolvedValue({ user: { id: "u1", role: "editor" } });
    await expect(requireActor("post:publish")).resolves.toEqual({ id: "u1", role: "editor" });
  });
});
