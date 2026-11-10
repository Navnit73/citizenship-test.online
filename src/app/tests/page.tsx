import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageFallback } from "@/components/site/PageFallback";
import { COUNTRY_CODES, COUNTRY_NAMES } from "@/lib/countries";
import { listPublicTests } from "@/lib/cms/public";
import { isCountryCode } from "@/lib/countries";

export const metadata: Metadata = { title: "All practice tests" };

async function Tests() {
  const tests = await listPublicTests();
  return tests.length === 0 ? (
    <p>No tests published yet.</p>
  ) : (
    <ul className="space-y-2">
      {tests.map((t) => (
        <li key={t.slug}>
          <Link href={`/tests/${t.slug}`} className="link">
            {t.title}
          </Link>{" "}
          <span className="text-sm opacity-80">
            ({isCountryCode(t.countryCode) ? COUNTRY_NAMES[t.countryCode] : t.countryCode})
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function TestsPage() {
  return (
    <main>
      <h1 className="mb-6 text-3xl font-bold">All practice tests</h1>
      <h2 className="mb-2 text-xl font-semibold">Mock exams with the official rules</h2>
      <ul className="mb-8 space-y-2">
        {COUNTRY_CODES.map((c) => (
          <li key={c}>
            <Link href={`/${c}/practice-test`} className="link">
              {COUNTRY_NAMES[c]} practice test
            </Link>
          </li>
        ))}
      </ul>
      <h2 className="mb-2 text-xl font-semibold">More tests</h2>
      <Suspense fallback={<PageFallback />}>
        <Tests />
      </Suspense>
    </main>
  );
}
