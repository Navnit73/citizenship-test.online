import type { Response, SessionQuestion } from "@/lib/engine/session";

export function formatClock(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function optionTexts(q: SessionQuestion, ids: string[]): string {
  return ids.map((id) => q.options.find((o) => o.id === id)?.text ?? id).join(", ");
}

export function formatResponse(q: SessionQuestion, response: Response): string {
  const out = Array.isArray(response) ? optionTexts(q, response) : response.trim();
  return out || "No answer";
}

export function formatCorrect(q: SessionQuestion): string {
  return q.type === "shorttext" || q.type === "dictation"
    ? q.acceptedAnswers[0]
    : optionTexts(q, q.correctOptionIds);
}

/** Text read aloud in Listen mode. Dictation reads only the sentence to write. */
export function spokenText(q: SessionQuestion): string {
  if (q.type === "dictation") return q.acceptedAnswers[0];
  const opts = q.options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o.text}.`).join(" ");
  return `${q.prompt} ${opts}`.trim();
}
