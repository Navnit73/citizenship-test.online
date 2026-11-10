import { describe, expect, it } from "vitest";
import { isShortTextCorrect, levenshtein, normalizeAnswer } from "./normalize";

describe("normalizeAnswer", () => {
  it('treats "The Constitution." and "constitution" as equal', () => {
    expect(normalizeAnswer("The Constitution.")).toBe(normalizeAnswer("constitution"));
  });
  it("collapses whitespace, punctuation and case", () => {
    expect(normalizeAnswer("  Freedom   of\tSpeech!! ")).toBe("freedom of speech");
  });
  it("strips diacritics", () => {
    expect(normalizeAnswer("Québec")).toBe("quebec");
  });
  it("keeps numbers", () => {
    expect(normalizeAnswer("27 amendments")).toBe("27 amendments");
  });
  it("returns empty string for blank input", () => {
    expect(normalizeAnswer("  .. ")).toBe("");
  });
});

describe("levenshtein", () => {
  it("computes edit distance", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
    expect(levenshtein("", "abc")).toBe(3);
    expect(levenshtein("same", "same")).toBe(0);
  });
});

describe("isShortTextCorrect", () => {
  const accepted = ["The Constitution", "the U.S. Constitution"];
  it("accepts exact normalised matches", () => {
    expect(isShortTextCorrect("constitution", accepted)).toBe(true);
  });
  it("tolerates one typo on longer answers", () => {
    expect(isShortTextCorrect("constituton", accepted)).toBe(true);
  });
  it("rejects typos on short answers", () => {
    expect(isShortTextCorrect("cat", ["car"])).toBe(false);
  });
  it("rejects wrong answers and blanks", () => {
    expect(isShortTextCorrect("the bill of rights", accepted)).toBe(false);
    expect(isShortTextCorrect("", accepted)).toBe(false);
  });
});
