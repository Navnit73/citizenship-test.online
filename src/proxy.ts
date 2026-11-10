import { NextResponse, type NextRequest } from "next/server";
import { resolveRedirect, type RedirectRule } from "@/lib/redirects";
import { canonicalHostRedirect } from "@/lib/seo/url";
import { SITE_URL } from "@/lib/site/config";

/** No local cache: redirects saved in the admin must take effect on the very next request. */
async function loadRules(origin: string): Promise<RedirectRule[]> {
  const res = await fetch(new URL("/api/redirects", origin), {
    signal: AbortSignal.timeout(1500),
  });
  return res.ok ? ((await res.json()) as RedirectRule[]) : [];
}

/**
 * 1. www / non-www → the host in SITE_URL (one canonical host).
 * 2. Admin-managed redirects (legacy URLs), followed to their final target in one hop.
 * 3. Upper-case paths → lower case (every route and slug on the site is lower case).
 * Fails open: a lookup problem never blocks a page.
 */
export async function proxy(request: NextRequest) {
  // `nextUrl.host` can be the server's bind address; the Host header is what the visitor used.
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const { protocol, pathname: path, search } = request.nextUrl;
  // Built from the header string (not the `host` setter, which would keep the old port).
  const seen = host ? new URL(`${path}${search}`, `${protocol}//${host}`) : request.nextUrl;
  const hostFix = canonicalHostRedirect(seen, SITE_URL);
  if (hostFix) return NextResponse.redirect(hostFix, 308);

  try {
    const hit = resolveRedirect(await loadRules(request.url), request.nextUrl.pathname);
    if (hit) {
      const target = new URL(hit.to, request.url);
      if (hit.to.startsWith("/") && !target.search) target.search = request.nextUrl.search;
      return NextResponse.redirect(target, hit.status);
    }
  } catch {
    /* fall through */
  }

  const { pathname } = request.nextUrl;
  if (pathname !== pathname.toLowerCase() && !pathname.startsWith("/_next")) {
    const target = request.nextUrl.clone();
    target.pathname = pathname.toLowerCase();
    return NextResponse.redirect(target, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|admin|login|sitemap.xml|robots.txt|opengraph-image|twitter-image|icon|apple-icon).*)",
  ],
};
