export type DictationResult = {
  correct: boolean;
  words: { expected: string; given: string | null; ok: boolean }[];
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, "")
    .split(/\s+/)
    .filter(Boolean);
}

/** Word-by-word spelling check. Unlike short text, articles count. */
export function gradeDictation(response: string, expected: string): DictationResult {
  const given = tokenize(response);
  const words = tokenize(expected).map((word, i) => ({
    expected: word,
    given: given[i] ?? null,
    ok: given[i] === word,
  }));
  return { correct: words.every((w) => w.ok) && given.length === words.length, words };
}
