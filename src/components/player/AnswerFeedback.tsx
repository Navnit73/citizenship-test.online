"use client";

import { useEffect, useRef } from "react";
import type { Response, SessionQuestion } from "@/lib/engine/session";
import { correctAnswerList, formatResponse } from "./format";

type Props = {
  question: SessionQuestion;
  response: Response;
  correct: boolean;
  isLast: boolean;
  /** Why the test is ending before the last question, if it is. */
  endNote?: string;
  onNext: () => void;
};

/** Shown right after an answer in practice mode: right/wrong, the answer, and why. */
export function AnswerFeedback({ question, response, correct, isLast, endNote, onNext }: Props) {
  const next = useRef<HTMLButtonElement>(null);
  useEffect(() => next.current?.focus(), []);
  const answers = correctAnswerList(question);
  const isText = question.type === "shorttext" || question.type === "dictation";

  return (
    <div
      role="status"
      className={`rounded-box border-2 p-5 ${
        correct ? "border-success bg-success/10" : "border-error bg-error/10"
      }`}
    >
      <p className="text-xl font-bold">{correct ? "✓ Correct" : "✗ Not quite"}</p>
      <p className="mt-2">
        <span className="font-semibold">Your answer:</span> {formatResponse(question, response)}
      </p>
      <div className="mt-1">
        <span className="font-semibold">
          {isText && answers.length > 1 ? "Accepted answers:" : "Correct answer:"}
        </span>{" "}
        {answers.join(" · ")}
      </div>
      {question.explanation && <p className="mt-3">{question.explanation}</p>}
      <p className="mt-2 text-sm opacity-70">Source: {question.sourceRef}</p>
      {endNote && <p className="mt-4 rounded bg-base-100 p-3 font-medium">{endNote}</p>}
      <div className="mt-4 flex justify-end">
        <button ref={next} type="button" className="btn btn-primary" onClick={onNext}>
          {isLast ? "See my results" : "Next question →"}
        </button>
      </div>
    </div>
  );
}
