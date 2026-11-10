import Papa from "papaparse";

const list = (v?: string) =>
  (v ?? "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

/** Parses the question-bank CSV format into import rows (validated later by the service). */
export function parseQuestionsCsv(text: string): Record<string, unknown>[] {
  const { data } = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  return data.map((r) => ({
    countryCode: r.countryCode?.trim(),
    versions: list(r.versions),
    chapter: r.chapter?.trim(),
    type: r.type?.trim(),
    prompt: r.prompt?.trim(),
    options: list(r.options).map((o) => {
      const i = o.indexOf(":");
      return { id: o.slice(0, i).trim(), text: o.slice(i + 1).trim() };
    }),
    correctOptionIds: list(r.correct),
    acceptedAnswers: list(r.accepted),
    explanation: r.explanation?.trim() || undefined,
    sourceRef: r.sourceRef?.trim(),
    tags: list(r.tags),
    difficulty: r.difficulty?.trim() ? Number(r.difficulty) : undefined,
    status: r.status?.trim() || undefined,
  }));
}
