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
import { requiredCorrect } from "@/lib/engine/scoring";
import { AnswerFeedback } from "./AnswerFeedback";
import { formatClock } from "./format";
import { QuestionCard, type StudyMode } from "./QuestionCard";
import { Results } from "./Results";

type Props = {
  country: CountryCode;
  loadExam?: () => Promise<ExamPayload>;
};

type Phase = "loading" | "error" | "ready" | "running";

const MODES: { value: StudyMode; label: string; hint: string }[] = [
  { value: "read", label: "Read the questions", hint: "Questions appear as text on screen." },
  {
    value: "listen",
    label: "Hear the questions read aloud",
    hint: "Good practice for a spoken interview, where an officer asks the questions.",
  },
];

/** Like the real US interview, some tests stop as soon as the result is certain. Say so. */
function earlyEndNote(s: Session): string | undefined {
  if (s.finishedAt === undefined || s.answers.length >= s.questions.length) return undefined;
  return sessionScore(s).passed
    ? "You've reached the pass mark, so the test stops here, just like the real test."
    : "You can no longer reach the pass mark, so the test stops here, just like the real test. Take another test to keep practising.";
}

/** An answer that has been graded but not yet moved past (practice feedback). */
type Pending = { response: Response; correct: boolean; next: Session };

export function TestPlayer({ country, loadExam = () => fetchExam(country) }: Props) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [loadKey, setLoadKey] = useState(0);
  const [exam, setExam] = useState<ExamPayload | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [mode, setMode] = useState<StudyMode>("read");
  const [showFeedback, setShowFeedback] = useState(true);
  const [pending, setPending] = useState<Pending | null>(null);
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
    setPending(null);
    setSession(s);
    setPhase("running");
  }

  function reload() {
    sessionRef.current = null;
    setPending(null);
    setSession(null);
    setExam(null);
    setPhase("loading");
    setLoadKey((k) => k + 1);
  }

  function handleSubmit(response: Response) {
    if (!sessionRef.current) return;
    const now = Date.now();
    const next = submitAnswer(sessionRef.current, response, now - questionStart.current, now);
    if (!showFeedback) return commit(next);
    setPending({ response, correct: next.answers[next.answers.length - 1].correct, next });
  }

  function goNext() {
    if (!pending) return;
    setPending(null);
    commit(pending.next);
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
    // Same small-bank clamping the session applies, so the promise matches the test.
    const needed = requiredCorrect(startSession(v, exam.questions, 0).version);
    return (
      <div className="space-y-6">
        <div className="rounded-box border border-base-300 bg-base-200/50 p-5">
          <p className="text-lg">
            You&apos;ll answer <strong>{n} questions</strong>. To pass, get{" "}
            <strong>at least {needed} right</strong>.
            {v.timeLimitSec
              ? ` You have ${Math.round(v.timeLimitSec / 60)} minutes.`
              : " There is no time limit."}
          </p>
          {n < v.questionsAsked && (
            <p className="mt-2 text-sm opacity-80">
              The real test asks {v.questionsAsked} questions. We&apos;re still adding questions, so
              this practice test is shorter for now.
            </p>
          )}
        </div>
        <fieldset>
          <legend className="mb-2 font-semibold">How do you want the questions?</legend>
          <div className="space-y-2">
            {MODES.map((m) => (
              <label
                key={m.value}
                className="flex cursor-pointer items-start gap-3 rounded border border-base-300 p-3 hover:bg-base-200"
              >
                <input
                  type="radio"
                  name="mode"
                  className="radio mt-0.5"
                  checked={mode === m.value}
                  onChange={() => setMode(m.value)}
                />
                <span>
                  <span className="block font-medium">{m.label}</span>
                  <span className="block text-sm opacity-70">{m.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="checkbox mt-0.5"
            checked={showFeedback}
            onChange={(e) => setShowFeedback(e.target.checked)}
          />
          <span>
            <span className="block font-medium">Show the correct answer after each question</span>
            <span className="block text-sm opacity-70">
              Turn this off to practise like the real test, with answers only at the end.
            </span>
          </span>
        </label>
        <button type="button" className="btn btn-primary btn-lg" onClick={start}>
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
  const correctSoFar = session.answers.filter((a) => a.correct).length;
  return (
    <div className="space-y-4">
      {showFeedback && session.answers.length > 0 && (
        <p className="text-sm opacity-80">
          {correctSoFar} of {session.answers.length} correct so far · you need{" "}
          {requiredCorrect(session.version)} to pass
        </p>
      )}
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
        locked={pending !== null}
      />
      {pending && (
        <AnswerFeedback
          question={question}
          response={pending.response}
          correct={pending.correct}
          isLast={pending.next.finishedAt !== undefined}
          endNote={earlyEndNote(pending.next)}
          onNext={goNext}
        />
      )}
    </div>
  );
}
