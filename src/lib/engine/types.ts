export type CountryCode = "us" | "uk" | "ca" | "au";

export type PassRule = { type: "count" | "percent"; value: number };

export type ExamVersion = {
  key: string;
  questionsAsked: number;
  poolSize: number;
  passRule: PassRule;
  requiredTags?: { tag: string; mustAllBeCorrect: boolean }[];
  /** End the exam as soon as the result is mathematically decided. */
  stopWhenPassed: boolean;
  timeLimitSec?: number;
};

export type ScoredAnswer = { questionId: string; correct: boolean; tags?: string[] };

export type AttemptStatus = "in-progress" | "passed" | "failed";

export type ScoreResult = {
  correct: number;
  wrong: number;
  answered: number;
  total: number;
  requiredCorrect: number;
  percent: number;
  status: AttemptStatus;
  passed: boolean;
  /** Required tags with at least one wrong answer. */
  failedTags: string[];
  /** True when the exam can end now (decided early or all questions answered). */
  finished: boolean;
};
