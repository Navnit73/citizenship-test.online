import { beforeEach, describe, expect, it } from "vitest";
import { getGuestId, listGuestAttempts, saveGuestAttempt } from "./guest";

const attempt = (id: string, score = 1) => ({
  id,
  countryCode: "uk" as const,
  seed: "s",
  score,
  total: 24,
  passed: false,
  mode: "read" as const,
  startedAt: 1,
  finishedAt: 2,
  answers: [],
});

describe("guest storage", () => {
  beforeEach(() => localStorage.clear());

  it("creates a stable guest id", () => {
    const id = getGuestId();
    expect(id).toMatch(/.{8,}/);
    expect(getGuestId()).toBe(id);
  });
  it("saves and lists attempts, newest first", () => {
    saveGuestAttempt(attempt("a"));
    saveGuestAttempt(attempt("b"));
    expect(listGuestAttempts().map((a) => a.id)).toEqual(["b", "a"]);
  });
  it("caps stored attempts", () => {
    for (let i = 0; i < 60; i++) saveGuestAttempt(attempt(String(i)));
    expect(listGuestAttempts()).toHaveLength(50);
  });
  it("survives corrupt storage", () => {
    localStorage.setItem("ct.guest.attempts", "{not json");
    expect(listGuestAttempts()).toEqual([]);
  });
  it("does not throw when storage is unavailable", () => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error("denied");
    };
    expect(() => saveGuestAttempt(attempt("x"))).not.toThrow();
    Storage.prototype.setItem = orig;
  });
});
