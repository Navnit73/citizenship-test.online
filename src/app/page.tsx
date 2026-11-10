import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DynamicMarker } from "@/components/content/DynamicMarker";
import { CardsSkeleton } from "@/components/site/CardsSkeleton";
import { Faq } from "@/components/site/Faq";
import { CountrySelector, LatestPosts, TrustBlock } from "@/components/site/HomeSections";
import { JsonLd } from "@/components/site/JsonLd";
import { ModeDemo } from "@/components/site/ModeDemo";
import { buildMetadata } from "@/lib/seo/metadata";
import { organizationLd } from "@/lib/seo/schema";
import { SITE_URL } from "@/lib/site/config";

export const metadata: Metadata = buildMetadata({
  title: "Free citizenship test practice: US, UK, Canada and Australia",
  description:
    "Free practice tests for the US, UK, Canadian and Australian citizenship tests. Instant answers after every question, with explanations and official sources.",
  path: "/",
});

const FAQ = [
  {
    q: "Is citizenship-test.online free?",
    a: "Yes. Every practice test is free and you do not need an account.",
  },
  {
    q: "Is this the official citizenship test?",
    a: "No. This is an independent study resource and is not affiliated with any government. Each country page links to the official source.",
  },
  {
    q: "Which countries are covered?",
    a: "The United States, the United Kingdom, Canada and Australia, each with practice tests that follow that country's real exam rules.",
  },
  {
    q: "Can I hear the questions read aloud?",
    a: 'Yes. Before you start a test, choose "Hear the questions read aloud". This is good practice for the US test, where an officer asks the questions out loud.',
  },
  {
    q: "How accurate are the questions?",
    a: "Every question has a source reference and each country page shows when it was last reviewed. Exam rules do change, so always confirm with the official source.",
  },
  {
    q: "Does it work on my phone?",
    a: "Yes. The site is built mobile-first and the test player works with a keyboard and screen readers.",
  },
];

const STEPS = [
  ["Pick your country", "Choose the test you are preparing for below."],
  ["Answer questions", "See right away if you were right, with the correct answer and why."],
  ["Check your score", "Find out if you would pass and which topics need more work."],
];

export default function Home() {
  return (
    <main className="space-y-12">
      <section aria-labelledby="hero-heading">
        <h1 id="hero-heading" className="mb-3 text-4xl font-bold">
          Pass your citizenship test with free practice for the US, UK, Canada and Australia
        </h1>
        <p className="mb-5 max-w-2xl text-lg">
          Free, no sign-up. Pick your country, answer real-style questions and see the correct
          answer after each one.
        </p>
        <a href="#countries" className="btn btn-primary btn-lg">
          Choose your country to start
        </a>
      </section>

      <section id="countries" aria-labelledby="countries-heading" className="scroll-mt-20">
        <h2 id="countries-heading" className="mb-4 text-2xl font-bold">
          Choose your country
        </h2>
        <Suspense fallback={<CardsSkeleton label="Loading countries…" rows={4} />}>
          <CountrySelector />
        </Suspense>
      </section>

      <section aria-labelledby="how-heading">
        <h2 id="how-heading" className="mb-4 text-2xl font-bold">
          How it works
        </h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map(([title, text], i) => (
            <li key={title} className="rounded border border-base-300 p-4">
              <p className="text-sm opacity-80">Step {i + 1}</p>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="modes-heading">
        <h2 id="modes-heading" className="mb-2 text-2xl font-bold">
          Try it: three quick questions
        </h2>
        <p className="mb-4">This is how every practice test works.</p>
        <ModeDemo />
      </section>

      <section aria-labelledby="readiness-heading" className="rounded border border-base-300 p-6">
        <h2 id="readiness-heading" className="mb-2 text-2xl font-bold">
          Know when you&apos;re ready
        </h2>
        <p className="mb-3">
          Save your progress, see a readiness score for each country and get practice tests built
          from the questions you miss.
        </p>
        <Link href="/login" className="btn btn-outline">
          Create a free account
        </Link>
      </section>

      <section aria-labelledby="latest-heading">
        <h2 id="latest-heading" className="mb-4 text-2xl font-bold">
          Latest guides and articles
        </h2>
        <Suspense fallback={<CardsSkeleton label="Loading guides…" rows={3} compact />}>
          <LatestPosts />
        </Suspense>
      </section>

      <section aria-labelledby="trust-heading">
        <h2 id="trust-heading" className="mb-4 text-2xl font-bold">
          Where our information comes from
        </h2>
        <Suspense fallback={<CardsSkeleton label="Loading…" rows={2} compact />}>
          <TrustBlock />
        </Suspense>
      </section>

      <Faq items={FAQ} />
      <JsonLd data={organizationLd(SITE_URL)} />
      <DynamicMarker />
    </main>
  );
}
