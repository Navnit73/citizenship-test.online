import type { ExamVersion, ScoreResult, ScoredAnswer } from "./types";

/** Number of correct answers needed to pass, from the version's pass rule. */
export function requiredCorrect(version: ExamVersion): number {
  const { type, value } = version.passRule;
  return type === "count" ? value : Math.ceil((value / 100) * version.questionsAsked);
}

export function scoreAttempt(
  version: ExamVersion,
  answers: ScoredAnswer[],
  { final = false }: { final?: boolean } = {},
): ScoreResult {
  const total = version.questionsAsked;
  const needed = requiredCorrect(version);
  const correct = answers.filter((a) => a.correct).length;
  const answered = answers.length;
  const wrong = answered - correct;

  const failedTags = (version.requiredTags ?? [])
    .filter(({ tag, mustAllBeCorrect }) =>
      mustAllBeCorrect ? answers.some((a) => !a.correct && a.tags?.includes(tag)) : false,
    )
    .map(({ tag }) => tag);

  const allAnswered = answered >= total || final;
  const reachedPass = correct >= needed;
  const cannotPass = wrong > total - needed || failedTags.length > 0;

  let status: ScoreResult["status"] = "in-progress";
  if (version.stopWhenPassed) {
    if (reachedPass && failedTags.length === 0) status = "passed";
    else if (cannotPass) status = "failed";
  }
  if (status === "in-progress" && allAnswered) {
    status = reachedPass && failedTags.length === 0 ? "passed" : "failed";
  }

  return {
    correct,
    wrong,
    answered,
    total,
    requiredCorrect: needed,
    percent: answered === 0 ? 0 : Math.round((correct / (allAnswered ? total : answered)) * 100),
    status,
    passed: status === "passed",
    failedTags,
    finished: status !== "in-progress",
  };
}
