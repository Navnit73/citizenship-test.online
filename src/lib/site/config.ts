/** Public origin with no trailing slash, e.g. `https://citizenship-test.online`. */
export const SITE_URL = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

const isLocalOrigin = (url: string) =>
  /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?$/i.test(url);

/**
 * Whether search engines may index this deployment. Off for local origins, Vercel
 * preview/development deployments, and when `NOINDEX=true` is set (e.g. staging),
 * so non-production copies never compete with the real site. `ALLOW_INDEXING=true`
 * forces it on (e.g. end-to-end tests that check robots.txt and the sitemap locally).
 */
export function isIndexable(env: Record<string, string | undefined> = process.env): boolean {
  const site = (env.SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  if (env.NOINDEX === "true") return false;
  if (env.ALLOW_INDEXING === "true") return true;
  if (isLocalOrigin(site)) return false;
  if (env.VERCEL_ENV && env.VERCEL_ENV !== "production") return false;
  return true;
}

export const INDEXABLE = isIndexable();
