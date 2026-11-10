const ARTICLES = new Set(["a", "an", "the"]);

/** Lowercase, strip diacritics/punctuation/articles, collapse whitespace. */
export function normalizeAnswer(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .split(/\s+/)
    .filter((w) => w && !ARTICLES.has(w))
    .join(" ");
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = row;
  }
  return prev[b.length];
}

function tolerance(length: number): number {
  if (length >= 12) return 2;
  if (length >= 6) return 1;
  return 0;
}

const sortedWords = (s: string) =>
  s
    .split(" ")
    .filter((w) => w !== "and")
    .sort();

/** Normalised, typo-tolerant match against any accepted answer. */
export function isShortTextCorrect(response: string, acceptedAnswers: string[]): boolean {
  const given = normalizeAnswer(response);
  if (!given) return false;
  return acceptedAnswers.some((accepted) => {
    const target = normalizeAnswer(accepted);
    if (target === "") return false;
    if (levenshtein(given, target) <= tolerance(target.length)) return true;
    // Multi-part answers ("legislative, executive, and judicial") in any order.
    const g = sortedWords(given);
    const t = sortedWords(target);
    return t.length > 1 && g.join(" ") === t.join(" ");
  });
}
