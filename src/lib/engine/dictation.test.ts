import { describe, expect, it } from "vitest";
import { gradeDictation } from "./dictation";

describe("gradeDictation", () => {
  const expected = "The President lives in the White House.";
  it("accepts a correct sentence ignoring case and punctuation", () => {
    const r = gradeDictation("the president lives in the white house", expected);
    expect(r.correct).toBe(true);
    expect(r.words.every((w) => w.ok)).toBe(true);
  });
  it("flags misspelled words individually", () => {
    const r = gradeDictation("The Presidnet lives in the White House", expected);
    expect(r.correct).toBe(false);
    expect(r.words.filter((w) => !w.ok).map((w) => w.expected)).toEqual(["president"]);
  });
  it("flags missing words", () => {
    const r = gradeDictation("The President lives in White House", expected);
    expect(r.correct).toBe(false);
    expect(r.words.length).toBe(7);
  });
  it("is strict about articles (unlike short text)", () => {
    expect(gradeDictation("President lives in White House", expected).correct).toBe(false);
  });
});
