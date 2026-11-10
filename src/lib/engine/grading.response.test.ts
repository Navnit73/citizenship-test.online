import { describe, expect, it } from "vitest";
import { gradeResponse } from "./grading";

const base = { options: [], correctOptionIds: [], acceptedAnswers: [] };

describe("gradeResponse", () => {
  it("grades choice questions", () => {
    expect(gradeResponse({ ...base, type: "single", correctOptionIds: ["a"] }, ["a"])).toBe(true);
    expect(gradeResponse({ ...base, type: "multiple", correctOptionIds: ["a", "b"] }, ["a"])).toBe(
      false,
    );
  });
  it("grades short text and dictation", () => {
    expect(
      gradeResponse({ ...base, type: "shorttext", acceptedAnswers: ["Ottawa"] }, "ottawa"),
    ).toBe(true);
    expect(
      gradeResponse(
        { ...base, type: "dictation", acceptedAnswers: ["I like apples"] },
        "I like apples",
      ),
    ).toBe(true);
    expect(
      gradeResponse(
        { ...base, type: "dictation", acceptedAnswers: ["I like apples"] },
        "I like apple",
      ),
    ).toBe(false);
  });
  it("treats a mismatched response shape as wrong", () => {
    expect(gradeResponse({ ...base, type: "single", correctOptionIds: ["a"] }, "a")).toBe(false);
    expect(gradeResponse({ ...base, type: "shorttext", acceptedAnswers: ["x"] }, ["x"])).toBe(
      false,
    );
  });
});
