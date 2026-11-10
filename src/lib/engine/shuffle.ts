function hashSeed(seed: string | number): number {
  let h = 1779033703 ^ String(seed).length;
  for (const ch of String(seed)) {
    h = Math.imul(h ^ ch.charCodeAt(0), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

/** mulberry32 PRNG: small, fast, deterministic. */
function rng(seed: string | number): () => number {
  let a = hashSeed(seed);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(items: readonly T[], seed: string | number): T[] {
  const out = [...items];
  const random = rng(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Shuffle, drop repeated ids, and take `count` questions. */
export function pickQuestions<T extends { id: string }>(
  pool: readonly T[],
  count: number,
  seed: string | number,
): T[] {
  const unique = [...new Map(pool.map((q) => [q.id, q])).values()];
  return seededShuffle(unique, seed).slice(0, count);
}
