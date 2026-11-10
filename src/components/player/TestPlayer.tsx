"use client";

import { useEffect, useRef, useState } from "react";
import { fetchExam } from "@/lib/api/exams";
import { createCountdown } from "@/lib/engine/timer";
import {
  currentQuestion,
  expireSession,
  sessionScore,
  startSession,
  submitAnswer,
  type Response,
  type Session,
} from "@/lib/engine/session";
import type { CountryCode } from "@/lib/engine/types";
import type { ExamPayload } from "@/lib/exam";
import { saveGuestAttempt } from "@/lib/guest";
import { formatClock } from "./format";
import { QuestionCard, type StudyMode } from "./QuestionCard";
import { Results } from "./Results";

type Props = {
  country: CountryCode;
  loadExam?: () => Promise<ExamPayload>;
};

type Phase = "loading" | "error" | "ready" | "running";

const MODES: { value: StudyMode; label: string }[] = [
  { value: "read", label: "Read" },
  { value: "listen", label: "Listen" },
  { value: "write", label: "Write" },
];

export function TestPlayer({ country, loadExam = () => fetchExam(country) }: Props) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [loadKey, setLoadKey] = useState(0);
  const [exam, setExam] = useState<ExamPayload | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [mode, setMode] = useState<StudyMode>(country === "us" ? "listen" : "read");
  const [speed, setSpeed] = useState(1);
  const [autoPlay, setAutoPlay] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  const sessionRef = useRef<Session | null>(null);
  const questionStart = useRef(0);
  const modeRef = useRef(mode);

  useEffect(() => {
    let cancelled = false;
    loadExam()
      .then((payload) => {
        if (cancelled) return;
        setExam(payload);
        setPhase("ready");
      })
      .catch(() => !cancelled && setPhase("error"));
    return () => {
      cancelled = true;
    };
    // loadExam is intentionally excluded: callers pass inline functions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, loadKey]);

  function commit(next: Session) {
    const wasFinished = sessionRef.current?.finishedAt !== undefined;
    sessionRef.current = next;
    setSession(next);
    questionStart.current = Date.now();
    if (next.finishedAt !== undefined && !wasFinished) {
      const score = sessionScore(next);
      saveGuestAttempt({
        id: crypto.randomUUID(),
        countryCode: country,
        seed: exam?.seed ?? "",
        score: score.correct,
        total: score.total,
        passed: score.passed,
        mode: modeRef.current,
        startedAt: next.startedAt,
        finishedAt: next.finishedAt,
        answers: next.answers,
      });
    }
  }

  const limit = session?.version.timeLimitSec;
  const running = session !== null && session.finishedAt === undefined;
  useEffect(() => {
    if (!running || !limit) return;
    const timer = createCountdown({
      limitSec: limit,
      onTick: setRemaining,
      onExpire: () => {
        if (sessionRef.current) commit(expireSession(sessionRef.current, Date.now()));
      },
    });
    return () => timer.stop();
    // commit only reads refs and stable setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, limit]);

  function start() {
    if (!exam) return;
    modeRef.current = mode;
    const now = Date.now();
    const s = startSession(exam.version, exam.questions, now);
    sessionRef.current = s;
    questionStart.current = now;
    setRemaining(s.version.timeLimitSec ?? null);
    setSession(s);
    setPhase("running");
  }

  function reload() {
    sessionRef.current = null;
    setSession(null);
    setExam(null);
    setPhase("loading");
    setLoadKey((k) => k + 1);
  }

  function handleSubmit(response: Response) {
    if (!sessionRef.current) return;
    const now = Date.now();
    commit(submitAnswer(sessionRef.current, response, now - questionStart.current, now));
  }

  if (phase === "loading") {
    return (
      <p role="status" className="flex items-center gap-2">
        <span className="loading loading-spinner" aria-hidden="true" /> Loading test…
      </p>
    );
  }

  if (phase === "error") {
    return (
      <div role="alert" className="alert alert-error">
        <span>We couldn&apos;t load the test.</span>
        <button type="button" className="btn btn-sm" onClick={reload}>
          Try again
        </button>
      </div>
    );
  }

  if (phase === "ready" && exam) {
    if (exam.questions.length === 0) {
      return <p>No questions available yet. Please check back soon.</p>;
    }
    const v = exam.version;
    const n = Math.min(v.questionsAsked, exam.questions.length);
    return (
      <div className="space-y-6">
        <p>
          {n} questions
          {v.timeLimitSec ? ` · ${Math.round(v.timeLimitSec / 60)} minutes` : " · no time limit"}
        </p>
        <fieldset>
          <legend className="mb-2 font-semibold">Study mode</legend>
          <div className="flex flex-wrap gap-4">
            {MODES.map((m) => (
              <label key={m.value} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  className="radio"
                  checked={mode === m.value}
                  onChange={() => setMode(m.value)}
                />
                {m.label}
              </label>
            ))}
          </div>
        </fieldset>
        <button type="button" className="btn btn-primary" onClick={start}>
          Start test
        </button>
      </div>
    );
  }

  if (!session) return null;

  if (session.finishedAt !== undefined) {
    return <Results session={session} onRetry={reload} />;
  }

  const question = currentQuestion(session)!;
  return (
    <div className="space-y-4">
      {remaining !== null && (
        <div role="timer" aria-label="Time remaining" className="badge badge-lg badge-outline">
          {formatClock(remaining)}
        </div>
      )}
      <QuestionCard
        key={question.id}
        question={question}
        index={session.answers.length}
        total={session.questions.length}
        mode={mode}
        autoPlay={autoPlay}
        speed={speed}
        onSpeedChange={setSpeed}
        onAutoPlayChange={setAutoPlay}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
