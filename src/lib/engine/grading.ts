import { gradeDictation } from "./dictation";
import { isShortTextCorrect } from "./normalize";

/** Exact-set comparison for single and multiple choice questions. */
export function gradeChoice(selected: string[], correct: string[]): boolean {
  const s = new Set(selected);
  return s.size > 0 && s.size === correct.length && correct.every((id) => s.has(id));
}

export type GradableQuestion = {
  type: "single" | "multiple" | "truefalse" | "shorttext" | "dictation";
  correctOptionIds: string[];
  acceptedAnswers: string[];
};

/** Choice questions take string[] (selected ids); text questions take a string. */
export function gradeResponse(question: GradableQuestion, response: string[] | string): boolean {
  if (question.type === "shorttext") {
    return typeof response === "string" && isShortTextCorrect(response, question.acceptedAnswers);
  }
  if (question.type === "dictation") {
    return (
      typeof response === "string" &&
      question.acceptedAnswers.some((a) => gradeDictation(response, a).correct)
    );
  }
  return Array.isArray(response) && gradeChoice(response, question.correctOptionIds);
}
