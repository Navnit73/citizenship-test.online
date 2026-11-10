import { describe, expect, it } from "vitest";
import { pickQuestions, seededShuffle } from "./shuffle";

const items = Array.from({ length: 50 }, (_, i) => i);

describe("seededShuffle", () => {
  it("is deterministic for the same seed", () => {
    expect(seededShuffle(items, "abc")).toEqual(seededShuffle(items, "abc"));
  });
  it("differs for different seeds", () => {
    expect(seededShuffle(items, "abc")).not.toEqual(seededShuffle(items, "abd"));
  });
  it("is a permutation and does not mutate the input", () => {
    const copy = [...items];
    const out = seededShuffle(items, 42);
    expect(items).toEqual(copy);
    expect([...out].sort((a, b) => a - b)).toEqual(items);
  });
});

describe("pickQuestions", () => {
  const pool = Array.from({ length: 30 }, (_, i) => ({ id: `q${i}` }));
  it("returns the requested count with no repeats", () => {
    const picked = pickQuestions(pool, 20, "seed");
    expect(picked).toHaveLength(20);
    expect(new Set(picked.map((q) => q.id)).size).toBe(20);
  });
  it("de-duplicates a pool that contains repeated ids", () => {
    const dupes = [...pool, ...pool];
    const picked = pickQuestions(dupes, 30, "seed");
    expect(new Set(picked.map((q) => q.id)).size).toBe(30);
  });
  it("returns the whole pool when count exceeds it", () => {
    expect(pickQuestions(pool, 99, "s")).toHaveLength(30);
  });
});
