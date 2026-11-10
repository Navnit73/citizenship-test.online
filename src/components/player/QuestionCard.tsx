"use client";

import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { canSpeak, speak } from "@/lib/audio/speech";
import type { Response, SessionQuestion } from "@/lib/engine/session";
import { spokenText } from "./format";

export type StudyMode = "read" | "listen" | "write";

type Props = {
  question: SessionQuestion;
  index: number;
  total: number;
  mode: StudyMode;
  autoPlay: boolean;
  speed: number;
  onSpeedChange?: (speed: number) => void;
  onAutoPlayChange?: (on: boolean) => void;
  onSubmit: (response: Response) => void;
};

const noopSubscribe = () => () => {};

export function QuestionCard({
  question,
  index,
  total,
  mode,
  autoPlay,
  speed,
  onSpeedChange,
  onAutoPlayChange,
  onSubmit,
}: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [typed, setTyped] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);

  const isText = question.type === "shorttext" || question.type === "dictation";
  const isDictation = question.type === "dictation";
  const showAudio = mode === "listen" || isDictation;
  const supported = useSyncExternalStore(noopSubscribe, canSpeak, () => false);
  const canPlay = supported || !!question.audioUrl;

  useEffect(() => {
    if (!showAudio || !autoPlay || !canPlay) return;
    return speak({ text: spokenText(question), rate: speed, audioUrl: question.audioUrl });
    // Autoplay once per question; speed changes apply to the next play.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id, showAudio, autoPlay, canPlay]);

  const toggle = (id: string) =>
    setSelected((cur) =>
      question.type === "multiple"
        ? cur.includes(id)
          ? cur.filter((x) => x !== id)
          : [...cur, id]
        : [id],
    );

  const canSubmit = isText ? typed.trim() !== "" : selected.length > 0;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(isText ? typed : selected);
  }

  const audioControls = showAudio && (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      {canPlay ? (
        <>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() =>
              speak({ text: spokenText(question), rate: speed, audioUrl: question.audioUrl })
            }
          >
            {isDictation ? "Play sentence" : "Play question"}
          </button>
          <label className="flex items-center gap-2 text-sm">
            Speed
            <select
              className="select select-sm"
              value={speed}
              onChange={(e) => onSpeedChange?.(Number(e.target.value))}
            >
              <option value={0.75}>0.75×</option>
              <option value={1}>1×</option>
              <option value={1.25}>1.25×</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={autoPlay}
              onChange={(e) => onAutoPlayChange?.(e.target.checked)}
            />
            Auto-play
          </label>
        </>
      ) : (
        <p role="note" className="text-sm">
          Audio isn&apos;t supported in this browser. Read the question instead.
        </p>
      )}
      {isDictation && (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          aria-expanded={showTranscript}
          onClick={() => setShowTranscript((v) => !v)}
        >
          {showTranscript ? "Hide transcript" : "Show transcript"}
        </button>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="card bg-base-100 border border-base-300 shadow-sm">
      <div className="card-body">
        <p className="text-sm opacity-80">
          Question {index + 1} of {total} · {question.chapterTitle}
        </p>
        {audioControls}
        {isDictation && showTranscript && (
          <p className="rounded bg-base-200 p-3">{question.acceptedAnswers[0]}</p>
        )}

        {isText ? (
          <>
            <p className="text-lg font-semibold" id={`prompt-${question.id}`}>
              {question.prompt}
            </p>
            <label className="form-control">
              <span className="mb-1 block text-sm">Your answer</span>
              <input
                type="text"
                className="input input-bordered w-full"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                aria-describedby={`prompt-${question.id}`}
              />
            </label>
          </>
        ) : (
          <fieldset className="space-y-2">
            <legend className="mb-2 text-lg font-semibold">{question.prompt}</legend>
            {question.type === "multiple" && (
              <p className="mb-2 text-sm opacity-80">Select all that apply.</p>
            )}
            {question.options.map((o) => (
              <label
                key={o.id}
                className="flex cursor-pointer items-center gap-3 rounded border border-base-300 p-3 hover:bg-base-200"
              >
                <input
                  type={question.type === "multiple" ? "checkbox" : "radio"}
                  name={`q-${question.id}`}
                  className={question.type === "multiple" ? "checkbox" : "radio"}
                  checked={selected.includes(o.id)}
                  onChange={() => toggle(o.id)}
                />
                <span>{o.text}</span>
              </label>
            ))}
          </fieldset>
        )}

        <div className="card-actions mt-4 justify-end">
          <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
            Submit answer
          </button>
        </div>
      </div>
    </form>
  );
}
