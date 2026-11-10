import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DynamicMarker } from "@/components/content/DynamicMarker";
import { PageFallback } from "@/components/site/PageFallback";
import { TestBySlug } from "@/components/player/TestBySlug";
import { getPublicTest } from "@/lib/cms/public";
import { isCountryCode } from "@/lib/countries";

export async function generateMetadata({ params }: PageProps<"/tests/[slug]">): Promise<Metadata> {
  const test = await getPublicTest((await params).slug);
  if (!test) return { title: "Test not found", robots: { index: false } };
  return {
    title: test.seo?.title || test.title,
    description: test.seo?.description,
    robots: test.seo?.noindex ? { index: false } : undefined,
  };
}

async function Test({ params }: { params: Promise<{ slug: string }> }) {
  const test = await getPublicTest((await params).slug);
  if (!test || !isCountryCode(test.countryCode)) notFound();
  return (
    <main>
      <h1 className="mb-6 text-3xl font-bold">{test.title}</h1>
      <TestBySlug slug={test.slug} country={test.countryCode} />
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
