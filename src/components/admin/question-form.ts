export type QuestionFormState = {
  countryCode: "us" | "uk" | "ca" | "au";
  versions: string;
  chapterId: string;
  type: "single" | "multiple" | "truefalse" | "shorttext" | "dictation";
  prompt: string;
  options: string;
  correct: string;
  accepted: string;
  explanation: string;
  sourceRef: string;
  tags: string;
  difficulty: number;
  status: "draft" | "published";
};

export const emptyQuestionForm: QuestionFormState = {
  countryCode: "uk",
  versions: "",
  chapterId: "",
  type: "single",
  prompt: "",
  options: "",
  correct: "",
  accepted: "",
  explanation: "",
  sourceRef: "",
  tags: "",
  difficulty: 1,
  status: "draft",
};

const csv = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
const lines = (s: string) =>
  s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

/** "a: Text" lines (or plain lines, auto-lettered). Colons inside the text are kept. */
export function parseOptions(text: string): { id: string; text: string }[] {
  return lines(text).map((line, i) => {
    const m = /^([A-Za-z0-9_-]{1,12})\s*:\s*(.+)$/.exec(line);
    return m ? { id: m[1], text: m[2] } : { id: String.fromCharCode(97 + i), text: line };
  });
}

export const formatOptions = (opts: { id: string; text: string }[]) =>
  opts.map((o) => `${o.id}: ${o.text}`).join("\n");

const isChoice = (t: string) => ["single", "multiple", "truefalse"].includes(t);

export function toQuestionPayload(f: QuestionFormState) {
  const choice = isChoice(f.type);
  return {
    countryCode: f.countryCode,
    versions: csv(f.versions),
    chapterId: f.chapterId,
    type: f.type,
    prompt: f.prompt.trim(),
    options: choice ? parseOptions(f.options) : [],
    correctOptionIds: choice ? csv(f.correct) : [],
    acceptedAnswers: choice ? [] : lines(f.accepted),
    explanation: f.explanation.trim() || undefined,
    sourceRef: f.sourceRef.trim(),
    tags: csv(f.tags),
    difficulty: f.difficulty,
    status: f.status,
  };
}

export type ApiQuestion = {
  id: string;
  countryCode: QuestionFormState["countryCode"];
  versions: string[];
  chapterId: string;
  type: QuestionFormState["type"];
  prompt: string;
  options: { id: string; text: string }[];
  correctOptionIds: string[];
  acceptedAnswers: string[];
  explanation?: string;
  sourceRef: string;
  tags: string[];
  difficulty: number;
  status: QuestionFormState["status"];
};

export function fromQuestion(q: ApiQuestion): QuestionFormState {
  return {
    countryCode: q.countryCode,
    versions: q.versions.join(", "),
    chapterId: String(q.chapterId),
    type: q.type,
    prompt: q.prompt,
    options: formatOptions(q.options),
    correct: q.correctOptionIds.join(", "),
    accepted: q.acceptedAnswers.join("\n"),
    explanation: q.explanation ?? "",
    sourceRef: q.sourceRef,
    tags: q.tags.join(", "),
    difficulty: q.difficulty,
    status: q.status,
  };
}
