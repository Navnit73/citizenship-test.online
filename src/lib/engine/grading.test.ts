import { describe, expect, it } from "vitest";
import { gradeChoice } from "./grading";

describe("gradeChoice", () => {
  it("single choice", () => {
    expect(gradeChoice(["b"], ["b"])).toBe(true);
    expect(gradeChoice(["a"], ["b"])).toBe(false);
  });
  it("multiple choice requires the exact set (UK select two)", () => {
    expect(gradeChoice(["b", "a"], ["a", "b"])).toBe(true);
    expect(gradeChoice(["a"], ["a", "b"])).toBe(false);
    expect(gradeChoice(["a", "b", "c"], ["a", "b"])).toBe(false);
  });
  it("empty selection is wrong", () => {
    expect(gradeChoice([], ["a"])).toBe(false);
  });
});
