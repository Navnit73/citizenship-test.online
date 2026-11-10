"use client";

import { useState } from "react";
import { QuestionCard, type StudyMode } from "@/components/player/QuestionCard";
import { gradeResponse } from "@/lib/engine/grading";
import type { Response, SessionQuestion } from "@/lib/engine/session";

const base = { explanation: undefined, tags: [], chapterTitle: "Demo", sourceRef: "demo" };
const QUESTIONS: SessionQuestion[] = [
  {
    ...base,
    id: "d1",
    type: "single",
    prompt: "What is the capital of Canada?",
    options: [
      { id: "a", text: "Ottawa" },
      { id: "b", text: "Toronto" },
      { id: "c", text: "Montreal" },
    ],
    correctOptionIds: ["a"],
    acceptedAnswers: [],
  },
  {
    ...base,
    id: "d2",
    type: "single",
    prompt: "In which year was the Battle of Hastings?",
    options: [
      { id: "a", text: "1066" },
      { id: "b", text: "1215" },
      { id: "c", text: "1415" },
    ],
    correctOptionIds: ["a"],
    acceptedAnswers: [],
  },
  {
    ...base,
    id: "d3",
    type: "shorttext",
    prompt: "What is the supreme law of the land in the United States?",
    options: [],
    correctOptionIds: [],
    acceptedAnswers: ["the Constitution"],
  },
];

const MODES: { value: StudyMode; label: string }[] = [
  { value: "read", label: "Read" },
  { value: "listen", label: "Listen" },
  { value: "write", label: "Write" },
];

/** Three-question taster of Read / Listen / Write for the home page. */
export function ModeDemo() {
  const [mode, setMode] = useState<StudyMode>("read");
  const [speed, setSpeed] = useState(1);
  const [results, setResults] = useState<boolean[]>([]);
  const index = results.length;

  function submit(response: Response) {
    setResults((r) => [...r, gradeResponse(QUESTIONS[index], response)]);
  }

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-2 font-semibold">Study mode</legend>
        <div className="flex gap-4">
          {MODES.map((m) => (
            <label key={m.value} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="demo-mode"
                className="radio"
                checked={mode === m.value}
                onChange={() => setMode(m.value)}
              />
              {m.label}
            </label>
          ))}
        </div>
      </fieldset>
      {index < QUESTIONS.length ? (
        <QuestionCard
          key={QUESTIONS[index].id}
          question={QUESTIONS[index]}
          index={index}
          total={QUESTIONS.length}
          mode={mode}
          autoPlay={false}
          speed={speed}
          onSpeedChange={setSpeed}
          onSubmit={submit}
        />
      ) : (
        <div role="status" className="rounded border border-base-300 p-4">
          <p className="font-semibold">You got {results.filter(Boolean).length} of 3.</p>
          <button
            type="button"
            className="btn btn-outline btn-sm mt-3"
            onClick={() => setResults([])}
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
