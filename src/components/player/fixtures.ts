import type { ExamPayload } from "@/lib/exam";
import type { SessionQuestion } from "@/lib/engine/session";

export const choice: SessionQuestion = {
  id: "c1",
  type: "single",
  prompt: "In which year was the Battle of Hastings?",
  options: [
    { id: "a", text: "1066" },
    { id: "b", text: "1215" },
  ],
  correctOptionIds: ["a"],
  acceptedAnswers: [],
  tags: [],
  explanation: "It was 1066.",
  sourceRef: "Handbook ch.1",
  chapterTitle: "History",
};
export const multi: SessionQuestion = {
  ...choice,
  id: "m1",
  type: "multiple",
  prompt: "Which TWO are countries of the UK?",
  options: [
    { id: "a", text: "Wales" },
    { id: "b", text: "France" },
    { id: "c", text: "Scotland" },
  ],
  correctOptionIds: ["a", "c"],
};
export const text: SessionQuestion = {
  ...choice,
  id: "t1",
  type: "shorttext",
  prompt: "What is the supreme law of the land?",
  options: [],
  correctOptionIds: [],
  acceptedAnswers: ["the Constitution"],
  explanation: undefined,
};
export const dictation: SessionQuestion = {
  ...text,
  id: "d1",
  type: "dictation",
  prompt: "Write the sentence you hear.",
  acceptedAnswers: ["The President lives in the White House."],
};

export function exam(questions: SessionQuestion[], timeLimitSec?: number): ExamPayload {
  return {
    countryCode: "uk",
    seed: "seed",
    version: {
      key: "v",
      questionsAsked: questions.length,
      poolSize: 10,
      passRule: { type: "count", value: questions.length },
      stopWhenPassed: false,
      timeLimitSec,
    },
    questions,
  };
}
