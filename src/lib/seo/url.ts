const bare = (host: string) => host.replace(/^www\./i, "").toLowerCase();

/**
 * When a request arrives on the www / non-www twin of the canonical host, returns the
 * same URL on the canonical host. Any other host (previews, localhost, IPs) is left alone.
 */
export function canonicalHostRedirect(url: URL, siteUrl: string): URL | null {
  let canonical: URL;
  try {
    canonical = new URL(siteUrl);
  } catch {
    return null;
  }
  const host = url.host.toLowerCase();
  if (host === canonical.host.toLowerCase()) return null;
  if (bare(host) !== bare(canonical.host)) return null;
  const target = new URL(url.toString());
  target.protocol = canonical.protocol;
  target.host = canonical.host;
  return target;
}
