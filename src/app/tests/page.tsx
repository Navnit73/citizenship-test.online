import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { COUNTRY_NAMES } from "@/lib/countries";
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
      <Suspense fallback={<p role="status">Loading…</p>}>
        <Tests />
      </Suspense>
    </main>
  );
}
