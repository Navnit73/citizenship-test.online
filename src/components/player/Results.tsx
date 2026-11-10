"use client";

import { useEffect, useRef } from "react";
import { sessionScore, type Session } from "@/lib/engine/session";
import { formatCorrect, formatResponse } from "./format";

type Props = { session: Session; onRetry: () => void };

export function Results({ session, onRetry }: Props) {
  const score = sessionScore(session);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);

  const byId = new Map(session.questions.map((q) => [q.id, q]));
  const chapters = new Map<string, { correct: number; total: number }>();
  for (const a of session.answers) {
    const title = byId.get(a.questionId)?.chapterTitle ?? "General";
    const row = chapters.get(title) ?? { correct: 0, total: 0 };
    row.total += 1;
    if (a.correct) row.correct += 1;
    chapters.set(title, row);
  }
  const unanswered = session.questions.length - session.answers.length;

  return (
    <section aria-labelledby="results-heading" className="space-y-6">
      <div className={`alert ${score.passed ? "alert-success" : "alert-error"}`}>
        <div>
          <h2 id="results-heading" ref={heading} tabIndex={-1} className="text-2xl font-bold">
            {score.passed ? "You passed" : "You did not pass"}
          </h2>
          <p className="mt-1">
            Score: <strong>{`${score.correct} / ${score.total}`}</strong> ({score.percent}%). Pass
            mark: {score.requiredCorrect} correct.
          </p>
          {session.timedOut && (
            <p>
              Time ran out
              {unanswered > 0 ? `, so ${unanswered} unanswered question(s) count as wrong.` : "."}
            </p>
          )}
          {score.failedTags.map((tag) => (
            <p key={tag}>You must answer every “{tag}” question correctly to pass.</p>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table">
          <caption className="mb-2 text-left font-semibold">Score by chapter</caption>
          <thead>
            <tr>
              <th scope="col">Chapter</th>
              <th scope="col">Correct</th>
            </tr>
          </thead>
          <tbody>
            {[...chapters].map(([title, r]) => (
              <tr key={title}>
                <th scope="row">{title}</th>
                <td>
                  {r.correct} / {r.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="mb-2 text-lg font-semibold">Review your answers</h3>
        <ol className="space-y-3">
          {session.answers.map((a) => {
            const q = byId.get(a.questionId)!;
            return (
              <li key={a.questionId} className="rounded border border-base-300 p-3">
                <p className="font-medium">{q.prompt}</p>
                <p>
                  <span className="badge badge-outline mr-2">
                    {a.correct ? "Correct" : "Incorrect"}
                  </span>
                  Your answer: {formatResponse(q, a.response)}
                </p>
                {!a.correct && (
                  <div className="mt-1 space-y-1 text-sm">
                    <p>Correct answer: {formatCorrect(q)}</p>
                    {q.explanation && <p>{q.explanation}</p>}
                    <p className="opacity-80">Source: {q.sourceRef}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <button type="button" className="btn btn-primary" onClick={onRetry}>
        Take another test
      </button>
    </section>
  );
}
