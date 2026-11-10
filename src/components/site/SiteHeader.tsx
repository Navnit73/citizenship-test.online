import Link from "next/link";
import { COUNTRY_CODES, COUNTRY_NAMES } from "@/lib/countries";
import { hubPath } from "@/lib/site/country-pages";

export function SiteHeader() {
  return (
    <header className="border-b border-base-300">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="font-bold">
          citizenship-test.online
        </Link>
        <nav aria-label="Main" className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {COUNTRY_CODES.map((c) => (
            <Link key={c} href={hubPath(c)} className="link link-hover">
              {COUNTRY_NAMES[c]}
            </Link>
          ))}
          <Link href="/tests" className="link link-hover">
            All tests
          </Link>
          <Link href="/guides" className="link link-hover">
            Guides
          </Link>
          <Link href="/blog" className="link link-hover">
            Blog
          </Link>
        </nav>
      </div>
    </header>
  );
}
