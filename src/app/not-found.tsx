import type { Metadata } from "next";
import Link from "next/link";
import { COUNTRY_CODES } from "@/lib/countries";
import { getCountryPage, hubPage, hubPath } from "@/lib/site/country-pages";

// Next.js adds `noindex` to every not-found response itself.
export const metadata: Metadata = { title: "Page not found" };

/** Real 404 status (Next.js sets it) plus a way back into the site instead of a dead end. */
export default function NotFound() {
  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p>The page you were looking for doesn&apos;t exist or has moved.</p>
      <section aria-labelledby="nf-tests">
        <h2 id="nf-tests" className="mb-2 text-xl font-semibold">
          Free practice tests
        </h2>
        <ul className="list-disc space-y-1 pl-6">
          {COUNTRY_CODES.map((c) => (
            <li key={c}>
              <Link href={`/${c}/practice-test`} className="link">
                {getCountryPage(c, "practice-test")!.heading}
              </Link>
              {" · "}
              <Link href={hubPath(c)} className="link">
                {hubPage(c).label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <p>
        <Link href="/" className="btn btn-primary">
          Go to the home page
        </Link>
      </p>
    </main>
  );
}
