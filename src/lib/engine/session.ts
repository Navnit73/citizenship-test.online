import { gradeResponse } from "./grading";
import { scoreAttempt } from "./scoring";
import type { ExamVersion, ScoreResult } from "./types";

export type SessionQuestion = {
  id: string;
  type: "single" | "multiple" | "truefalse" | "shorttext" | "dictation";
  prompt: string;
  options: { id: string; text: string }[];
  correctOptionIds: string[];
  acceptedAnswers: string[];
  tags: string[];
  explanation?: string;
  sourceRef: string;
  audioUrl?: string;
  chapterTitle: string;
};

export type Response = string[] | string;

export type RecordedAnswer = {
  questionId: string;
  response: Response;
  correct: boolean;
  timeMs: number;
};

export type Session = {
  version: ExamVersion;
  questions: SessionQuestion[];
  answers: RecordedAnswer[];
  startedAt: number;
  finishedAt?: number;
  timedOut?: boolean;
};

export function startSession(
  version: ExamVersion,
  questions: SessionQuestion[],
  now: number,
): Session {
  // Small-bank guard: never ask (or require) more than we have.
  const n = Math.min(version.questionsAsked, questions.length);
  const passRule =
    version.passRule.type === "count"
      ? { ...version.passRule, value: Math.min(version.passRule.value, n) }
      : version.passRule;
  return {
    version: { ...version, questionsAsked: n, passRule },
    questions: questions.slice(0, n),
    answers: [],
    startedAt: now,
  };
}

export function currentQuestion(s: Session): SessionQuestion | undefined {
  return s.finishedAt === undefined ? s.questions[s.answers.length] : undefined;
}

function scored(s: Session) {
  return s.answers.map((a) => ({
    questionId: a.questionId,
    correct: a.correct,
    tags: s.questions.find((q) => q.id === a.questionId)?.tags,
  }));
}

export function sessionScore(s: Session): ScoreResult {
  return scoreAttempt(s.version, scored(s), { final: s.finishedAt !== undefined });
}

export function submitAnswer(s: Session, response: Response, timeMs: number, now: number): Session {
  const question = currentQuestion(s);
  if (!question) return s;
  const next: Session = {
    ...s,
    answers: [
      ...s.answers,
      { questionId: question.id, response, correct: gradeResponse(question, response), timeMs },
    ],
  };
  const done =
    next.answers.length >= next.questions.length ||
    scoreAttempt(next.version, scored(next)).finished;
  return done ? { ...next, finishedAt: now } : next;
}

export function expireSession(s: Session, now: number): Session {
  return s.finishedAt === undefined ? { ...s, finishedAt: now, timedOut: true } : s;
}
