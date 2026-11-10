import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DynamicMarker } from "@/components/content/DynamicMarker";
import { PageFallback } from "@/components/site/PageFallback";
import { TestBySlug } from "@/components/player/TestBySlug";
import { getPublicTest } from "@/lib/cms/public";
import Link from "next/link";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { COUNTRY_NAMES, isCountryCode } from "@/lib/countries";
import { buildMetadata } from "@/lib/seo/metadata";
import { getCountryPage, hubPage, hubPath } from "@/lib/site/country-pages";

export async function generateMetadata({ params }: PageProps<"/tests/[slug]">): Promise<Metadata> {
  const test = await getPublicTest((await params).slug);
  if (!test || !isCountryCode(test.countryCode)) {
    return { title: "Test not found", robots: { index: false } };
  }
  const country = COUNTRY_NAMES[test.countryCode];
  return buildMetadata({
    title: test.seo?.title || test.title,
    description:
      test.seo?.description ||
      `${test.title}: a free ${country} citizenship practice test. See the correct answer and an explanation after every question.`,
    path: `/tests/${test.slug}`,
    noindex: !!test.seo?.noindex,
  });
}

async function Test({ params }: { params: Promise<{ slug: string }> }) {
  const test = await getPublicTest((await params).slug);
  if (!test || !isCountryCode(test.countryCode)) notFound();
  return (
    <main>
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "All tests", path: "/tests" },
          { name: test.title, path: `/tests/${test.slug}` },
        ]}
      />
      <h1 className="mb-6 text-3xl font-bold">{test.title}</h1>
      <TestBySlug slug={test.slug} country={test.countryCode} />
      <p className="mt-10">
        Ready for the full exam? Take the{" "}
        <Link href={`/${test.countryCode}/practice-test`} className="link">
          {getCountryPage(test.countryCode, "practice-test")!.heading.toLowerCase()}
        </Link>{" "}
        or read about the{" "}
        <Link href={hubPath(test.countryCode)} className="link">
          {hubPage(test.countryCode).label} rules and format
        </Link>
        .
      </p>
    </main>
  );
}

export default function TestPage({ params }: PageProps<"/tests/[slug]">) {
  return (
    <>
      <Suspense fallback={<PageFallback />}>
        <Test params={params} />
      </Suspense>
      <DynamicMarker />
    </>
  );
}
