import { NextResponse, type NextRequest } from "next/server";
import { resolveRedirect, type RedirectRule } from "@/lib/redirects";

/** Applies admin-managed redirects. Fails open: a lookup problem never blocks a page. */
export async function proxy(request: NextRequest) {
  try {
    const res = await fetch(new URL("/api/redirects", request.url), {
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) {
      const rules = (await res.json()) as RedirectRule[];
      const hit = resolveRedirect(rules, request.nextUrl.pathname);
      if (hit) {
        const target = new URL(hit.to, request.url);
        if (hit.to.startsWith("/") && !target.search) target.search = request.nextUrl.search;
        return NextResponse.redirect(target, hit.status);
      }
    }
  } catch {
    /* fall through */
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|admin|login|sitemap.xml|robots.txt).*)"],
};
