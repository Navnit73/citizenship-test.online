import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TestPlayer } from "@/components/player/TestPlayer";
import { COUNTRY_CODES, COUNTRY_NAMES, isCountryCode } from "@/lib/countries";

export function generateStaticParams() {
  return COUNTRY_CODES.map((country) => ({ country }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[country]/practice-test">): Promise<Metadata> {
  const { country } = await params;
  if (!isCountryCode(country)) return {};
  return { title: `${COUNTRY_NAMES[country]} citizenship practice test` };
}

export default async function PracticeTestPage({ params }: PageProps<"/[country]/practice-test">) {
  const { country } = await params;
  if (!isCountryCode(country)) notFound();
  return (
    <main>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm">
        <Link href="/" className="link">
          Home
        </Link>{" "}
        / {COUNTRY_NAMES[country]}
      </nav>
      <h1 className="mb-6 text-3xl font-bold">
        {COUNTRY_NAMES[country]} citizenship practice test
      </h1>
      <TestPlayer country={country} />
    </main>
  );
}
