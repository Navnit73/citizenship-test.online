import { describe, expect, it } from "vitest";
import { requiredCorrect, scoreAttempt } from "./scoring";
import type { ExamVersion, ScoredAnswer } from "./types";

const uk: ExamVersion = {
  key: "uk",
  questionsAsked: 24,
  poolSize: 1000,
  passRule: { type: "percent", value: 75 },
  stopWhenPassed: false,
  timeLimitSec: 2700,
};
const ca: ExamVersion = { ...uk, key: "ca", questionsAsked: 20, timeLimitSec: 1800 };
const au: ExamVersion = {
  ...uk,
  key: "au",
  questionsAsked: 20,
  timeLimitSec: 2700,
  requiredTags: [{ tag: "values", mustAllBeCorrect: true }],
};
const us2025: ExamVersion = {
  key: "2025",
  questionsAsked: 20,
  poolSize: 128,
  passRule: { type: "count", value: 12 },
  stopWhenPassed: true,
};
const us2008: ExamVersion = {
  key: "2008",
  questionsAsked: 10,
  poolSize: 100,
  passRule: { type: "count", value: 6 },
  stopWhenPassed: true,
};

function answers(correct: number, total: number, tagFn?: (i: number) => string[]): ScoredAnswer[] {
  return Array.from({ length: total }, (_, i) => ({
    questionId: `q${i}`,
    correct: i < correct,
    tags: tagFn?.(i),
  }));
}

describe("requiredCorrect", () => {
  it("rounds percent rules up", () => {
    expect(requiredCorrect(uk)).toBe(18);
    expect(
      requiredCorrect({ ...uk, passRule: { type: "percent", value: 70 }, questionsAsked: 24 }),
    ).toBe(17);
  });
  it("uses count rules directly", () => {
    expect(requiredCorrect(us2025)).toBe(12);
  });
});

describe("scoreAttempt - UK", () => {
  it("passes at 18/24", () => {
    const r = scoreAttempt(uk, answers(18, 24));
    expect(r.passed).toBe(true);
    expect(r.status).toBe("passed");
    expect(r.percent).toBe(75);
  });
  it("fails at 17/24", () => {
    const r = scoreAttempt(uk, answers(17, 24));
    expect(r.passed).toBe(false);
    expect(r.status).toBe("failed");
  });
  it("stays in progress until all questions are answered", () => {
    const r = scoreAttempt(uk, answers(10, 10));
    expect(r.status).toBe("in-progress");
    expect(r.finished).toBe(false);
  });
  it("fails early is NOT applied to non-stopping exams", () => {
    expect(scoreAttempt(uk, answers(0, 8)).status).toBe("in-progress");
  });
  it("handles zero answers", () => {
    const r = scoreAttempt(uk, []);
    expect(r.percent).toBe(0);
    expect(r.status).toBe("in-progress");
  });
});

describe("scoreAttempt - CA", () => {
  it("passes at 15/20", () => {
    expect(scoreAttempt(ca, answers(15, 20)).passed).toBe(true);
  });
  it("fails at 14/20", () => {
    expect(scoreAttempt(ca, answers(14, 20)).passed).toBe(false);
  });
});

describe("scoreAttempt - AU values rule", () => {
  const values = (i: number) => (i < 5 ? ["values"] : []);
  it("passes 20/20 with all values correct", () => {
    expect(scoreAttempt(au, answers(20, 20, values)).passed).toBe(true);
  });
  it("fails 19/20 if a values question is wrong", () => {
    const a = answers(20, 20, values);
    a[2] = { ...a[2], correct: false };
    const r = scoreAttempt(au, a);
    expect(r.correct).toBe(19);
    expect(r.passed).toBe(false);
    expect(r.failedTags).toEqual(["values"]);
  });
  it("passes 19/20 when the miss is not a values question", () => {
    const a = answers(20, 20, values);
    a[15] = { ...a[15], correct: false };
    expect(scoreAttempt(au, a).passed).toBe(true);
  });
});

describe("scoreAttempt - US stop rules", () => {
  it("2025: passes and stops at 12 correct", () => {
    const r = scoreAttempt(us2025, answers(12, 12));
    expect(r.status).toBe("passed");
    expect(r.finished).toBe(true);
  });
  it("2025: continues at 11 correct, 8 wrong", () => {
    expect(scoreAttempt(us2025, answers(11, 19)).status).toBe("in-progress");
  });
  it("2025: fails and stops after 9 wrong", () => {
    const wrong9 = Array.from({ length: 9 }, (_, i) => ({ questionId: `w${i}`, correct: false }));
    const r = scoreAttempt(us2025, wrong9);
    expect(r.status).toBe("failed");
    expect(r.finished).toBe(true);
  });
  it("2025: 8 wrong is not yet a fail", () => {
    const wrong8 = Array.from({ length: 8 }, (_, i) => ({ questionId: `w${i}`, correct: false }));
    expect(scoreAttempt(us2025, wrong8).status).toBe("in-progress");
  });
  it("2008: passes at 6 of 10", () => {
    expect(scoreAttempt(us2008, answers(6, 6)).status).toBe("passed");
  });
  it("2008: fails after 5 wrong", () => {
    const wrong5 = Array.from({ length: 5 }, (_, i) => ({ questionId: `w${i}`, correct: false }));
    expect(scoreAttempt(us2008, wrong5).status).toBe("failed");
  });
});

describe("scoreAttempt - final (time expired)", () => {
  it("fails a non-stopping exam that is incomplete", () => {
    const r = scoreAttempt(uk, answers(10, 10), { final: true });
    expect(r.status).toBe("failed");
    expect(r.percent).toBe(Math.round((10 / 24) * 100));
  });
  it("can still pass if enough were correct", () => {
    expect(scoreAttempt(uk, answers(18, 18), { final: true }).passed).toBe(true);
  });
});
