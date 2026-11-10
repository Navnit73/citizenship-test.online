export type RedirectRule = { from: string; to: string; status: number };

const norm = (p: string) => (p.length > 1 ? p.replace(/\/+$/, "") : p);

/** Resolves a path through the redirect rules, following chains. Loop-safe. */
export function resolveRedirect(
  rules: RedirectRule[],
  pathname: string,
): { to: string; status: number } | null {
  const map = new Map(rules.map((r) => [r.from, r]));
  let current = norm(pathname);
  let hit: RedirectRule | undefined;
  const seen = new Set<string>();
  while (map.has(current)) {
    if (seen.has(current)) return null;
    seen.add(current);
    hit = map.get(current)!;
    current = hit.to.startsWith("/") ? norm(hit.to) : hit.to;
    if (!current.startsWith("/")) break;
  }
  return hit ? { to: current, status: hit.status } : null;
}
