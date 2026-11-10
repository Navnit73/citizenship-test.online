import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageFallback } from "@/components/site/PageFallback";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { COUNTRY_CODES, COUNTRY_NAMES, isCountryCode } from "@/lib/countries";
import { listPublicTests } from "@/lib/cms/public";
import { buildMetadata } from "@/lib/seo/metadata";
import { getCountryPage } from "@/lib/site/country-pages";

export const metadata: Metadata = buildMetadata({
  title: "All free citizenship practice tests",
  description:
    "Every free practice test on the site: full mock exams for the US, UK, Canadian and Australian citizenship tests, plus shorter tests on specific topics.",
  path: "/tests",
});

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
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "All tests", path: "/tests" },
        ]}
      />
      <h1 className="mb-3 text-3xl font-bold">All practice tests</h1>
      <p className="mb-6 max-w-2xl">
        Full mock exams follow each country&apos;s official rules for the number of questions, pass
        mark and time limit. The shorter tests focus on a single topic.
      </p>
      <h2 className="mb-2 text-xl font-semibold">Mock exams with the official rules</h2>
      <ul className="mb-8 space-y-2">
        {COUNTRY_CODES.map((c) => (
          <li key={c}>
            <Link href={`/${c}/practice-test`} className="link">
              {getCountryPage(c, "practice-test")!.heading}
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
