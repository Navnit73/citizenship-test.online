import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DynamicMarker } from "@/components/content/DynamicMarker";
import { PageFallback } from "@/components/site/PageFallback";
import { CountryPageView } from "@/components/site/CountryPageView";
import { COUNTRY_NAMES, isCountryCode } from "@/lib/countries";
import { buildMetadata } from "@/lib/seo/metadata";
import { allCountryPageParams, countryPagePath, getCountryPage } from "@/lib/site/country-pages";
import { getSlotPost } from "@/lib/site/data";
import { connection } from "next/server";

export function generateStaticParams() {
  return allCountryPageParams();
}

export async function generateMetadata({
  params,
}: PageProps<"/[country]/[page]">): Promise<Metadata> {
  const { country, page } = await params;
  if (!isCountryCode(country)) return {};
  const def = getCountryPage(country, page);
  if (!def) return {};
  const name = COUNTRY_NAMES[country];
  // Long-form pages stay out of the index until someone has actually written them.
  let noindex = false;
  if (def.kind === "guide" || def.kind === "howto" || def.kind === "english") {
    await connection();
    noindex = (await getSlotPost(country, page)) === null;
  }
  return buildMetadata({
    title: def.title(name),
    description: def.description(name),
    path: countryPagePath(country, page),
    noindex,
  });
}

export default async function CountryPage({ params }: PageProps<"/[country]/[page]">) {
  const { country, page } = await params;
  if (!isCountryCode(country) || !getCountryPage(country, page)) notFound();
  return (
    <>
      <Suspense fallback={<PageFallback />}>
        <CountryPageView code={country} slug={page} />
      </Suspense>
      <DynamicMarker />
    </>
  );
}
