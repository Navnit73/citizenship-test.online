import { describe, expect, it } from "vitest";
import {
  currentQuestion,
  expireSession,
  sessionScore,
  startSession,
  submitAnswer,
  type SessionQuestion,
} from "./session";
import type { ExamVersion } from "./types";

const q = (i: number, extra: Partial<SessionQuestion> = {}): SessionQuestion => ({
  id: `q${i}`,
  type: "single",
  prompt: `Q${i}`,
  options: [
    { id: "a", text: "A" },
    { id: "b", text: "B" },
  ],
  correctOptionIds: ["a"],
  acceptedAnswers: [],
  tags: [],
  sourceRef: "ref",
  chapterTitle: "Ch",
  ...extra,
});

const version: ExamVersion = {
  key: "t",
  questionsAsked: 4,
  poolSize: 10,
  passRule: { type: "percent", value: 75 },
  stopWhenPassed: false,
  timeLimitSec: 60,
};

describe("session", () => {
  const questions = [q(1), q(2), q(3), q(4)];

  it("walks through questions and finishes after the last answer", () => {
    let s = startSession(version, questions, 0);
    expect(currentQuestion(s)?.id).toBe("q1");
    for (let i = 0; i < 4; i++) s = submitAnswer(s, ["a"], 500, 1000 * (i + 1));
    expect(s.finishedAt).toBeDefined();
    expect(currentQuestion(s)).toBeUndefined();
    expect(sessionScore(s)).toMatchObject({ correct: 4, passed: true });
  });

  it("records correctness and time per answer", () => {
    let s = startSession(version, questions, 0);
    s = submitAnswer(s, ["b"], 1234, 10);
    expect(s.answers[0]).toMatchObject({ questionId: "q1", correct: false, timeMs: 1234 });
  });

  it("grades short text answers with normalisation", () => {
    const t = q(1, {
      type: "shorttext",
      options: [],
      correctOptionIds: [],
      acceptedAnswers: ["The Constitution"],
    });
    let s = startSession({ ...version, questionsAsked: 1 }, [t], 0);
    s = submitAnswer(s, "constitution.", 1, 1);
    expect(s.answers[0].correct).toBe(true);
  });

  it("ignores answers after the session has finished", () => {
    let s = startSession({ ...version, questionsAsked: 1 }, [q(1)], 0);
    s = submitAnswer(s, ["a"], 1, 1);
    expect(submitAnswer(s, ["b"], 1, 2)).toBe(s);
  });

  it("counts unanswered questions as wrong when time expires", () => {
    let s = startSession(version, questions, 0);
    s = submitAnswer(s, ["a"], 1, 1);
    s = submitAnswer(s, ["a"], 1, 2);
    s = expireSession(s, 60_000);
    const score = sessionScore(s);
    expect(s.timedOut).toBe(true);
    expect(score.correct).toBe(2);
    expect(score.passed).toBe(false);
    expect(score.percent).toBe(50);
  });

  it("stops early for US-style exams once decided", () => {
    const us: ExamVersion = {
      key: "2008",
      questionsAsked: 10,
      poolSize: 100,
      passRule: { type: "count", value: 6 },
      stopWhenPassed: true,
    };
    let s = startSession(
      us,
      Array.from({ length: 10 }, (_, i) => q(i)),
      0,
    );
    for (let i = 0; i < 6; i++) s = submitAnswer(s, ["a"], 1, i);
    expect(s.finishedAt).toBeDefined();
    expect(sessionScore(s).passed).toBe(true);
  });

  it("clamps the exam size to the available questions", () => {
    const s = startSession({ ...version, questionsAsked: 24 }, [q(1), q(2)], 0);
    expect(s.version.questionsAsked).toBe(2);
    const us = startSession(
      { ...version, questionsAsked: 20, passRule: { type: "count", value: 12 } },
      [q(1), q(2)],
      0,
    );
    expect(us.version.passRule.value).toBe(2);
  });
});
