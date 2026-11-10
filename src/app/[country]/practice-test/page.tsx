import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ExamFacts, OfficialSource } from "@/components/site/ExamFacts";
import { Faq } from "@/components/site/Faq";
import { JsonLd } from "@/components/site/JsonLd";
import { TestPlayer } from "@/components/player/TestPlayer";
import { COUNTRY_CODES, COUNTRY_NAMES, isCountryCode } from "@/lib/countries";
import type { CountryCode } from "@/lib/engine/types";
import { buildMetadata } from "@/lib/seo/metadata";
import { quizLd } from "@/lib/seo/schema";
import { getCountryPage, hubPage, hubPath } from "@/lib/site/country-pages";
import { SITE_URL } from "@/lib/site/config";
import { getCountryData, getCountryQuestions } from "@/lib/site/data";
import { buildCountryFaq } from "@/lib/site/exam-describe";

export function generateStaticParams() {
  return COUNTRY_CODES.map((country) => ({ country }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[country]/practice-test">): Promise<Metadata> {
  const { country } = await params;
  if (!isCountryCode(country)) return {};
  const def = getCountryPage(country, "practice-test")!;
  const name = COUNTRY_NAMES[country];
  return buildMetadata({
    title: def.title(name),
    description: def.description(name),
    path: `/${country}/practice-test`,
  });
}

/** Rules, FAQ and Quiz markup come from the database; they stream in around the static player. */
async function PracticeInfo({ code }: { code: CountryCode }) {
  await connection();
  const [data, bank] = await Promise.all([getCountryData(code), getCountryQuestions(code)]);
  const { summary } = data;
  const faq = buildCountryFaq({
    countryName: summary.name === "United Kingdom" ? "the United Kingdom" : summary.name,
    testName: summary.testName,
    version: summary.version,
    officialUrl: summary.officialSourceUrl,
  });
  const questions = bank.chapters.flatMap((c) => c.questions.map((q) => q.prompt)).slice(0, 10);
  return (
    <div className="mt-10 space-y-8">
      <section aria-labelledby="rules-heading">
        <h2 id="rules-heading" className="mb-3 text-2xl font-bold">
          How this practice test works
        </h2>
        <ExamFacts summary={summary} />
      </section>
      <OfficialSource summary={summary} />
      <Faq items={faq} />
      {questions.length > 0 && (
        <JsonLd
          data={quizLd({
            name: `${COUNTRY_NAMES[code]} citizenship practice test`,
            url: `${SITE_URL}/${code}/practice-test`,
            questions,
          })}
        />
      )}
    </div>
  );
}

export default async function PracticeTestPage({ params }: PageProps<"/[country]/practice-test">) {
  const { country } = await params;
  if (!isCountryCode(country)) notFound();
  return (
    <main>
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: hubPage(country).label, path: hubPath(country) },
          { name: "Practice test", path: `/${country}/practice-test` },
        ]}
      />
      <h1 className="mb-6 text-3xl font-bold">
        {COUNTRY_NAMES[country]} citizenship practice test
      </h1>
      <TestPlayer country={country} />
      <Suspense fallback={<div className="mt-10 min-h-[70vh]" aria-hidden="true" />}>
        <PracticeInfo code={country} />
      </Suspense>
    </main>
  );
}
