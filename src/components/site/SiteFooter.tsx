import Link from "next/link";
import { Suspense } from "react";
import { COUNTRY_CODES, COUNTRY_NAMES } from "@/lib/countries";
import { listPublicPosts } from "@/lib/cms/public";
import { hubPath } from "@/lib/site/country-pages";
import { CookieSettingsButton } from "./CookieBanner";

async function LegalLinks() {
  const pages = await listPublicPosts("legal");
  return (
    <>
      {pages.map((p) => (
        <li key={p.slug}>
          <Link href={p.path} className="link link-hover">
            {p.title}
          </Link>
        </li>
      ))}
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-base-300">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:grid-cols-3">
        <nav aria-label="Countries">
          <p className="mb-2 font-semibold">Countries</p>
          <ul className="space-y-1">
            {COUNTRY_CODES.map((c) => (
              <li key={c}>
                <Link href={hubPath(c)} className="link link-hover">
                  {COUNTRY_NAMES[c]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Resources">
          <p className="mb-2 font-semibold">Resources</p>
          <ul className="space-y-1">
            <li>
              <Link href="/tests" className="link link-hover">
                All practice tests
              </Link>
            </li>
            <li>
              <Link href="/guides" className="link link-hover">
                Guides
              </Link>
            </li>
            <li>
              <Link href="/how-to" className="link link-hover">
                How-to
              </Link>
            </li>
            <li>
              <Link href="/blog" className="link link-hover">
                Blog
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Legal">
          <p className="mb-2 font-semibold">Legal</p>
          <ul className="space-y-1">
            <Suspense fallback={null}>
              <LegalLinks />
            </Suspense>
            <li>
              <CookieSettingsButton />
            </li>
          </ul>
        </nav>
      </div>
      <p className="mx-auto max-w-5xl px-4 pb-6 text-sm">
        citizenship-test.online is an independent study resource. It is not affiliated with USCIS,
        the UK Home Office, IRCC or the Australian Department of Home Affairs. Always check the
        official source for current rules.
      </p>
    </footer>
  );
}
