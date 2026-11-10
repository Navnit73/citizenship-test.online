import Link from "next/link";
import { connection } from "next/server";
import { Breadcrumbs, type Crumb } from "@/components/site/Breadcrumbs";
import { ExamFacts, OfficialSource } from "@/components/site/ExamFacts";
import { Faq } from "@/components/site/Faq";
import { Prose } from "@/components/site/Prose";
import { Toc } from "@/components/site/Toc";
import { addHeadingIds } from "@/lib/cms/toc";
import { COUNTRY_NAMES } from "@/lib/countries";
import type { CountryCode } from "@/lib/engine/types";
import {
  COUNTRY_PAGES,
  countryPagePath,
  getCountryPage,
  hubPage,
  hubPath,
} from "@/lib/site/country-pages";
import { getCountryData, getCountryQuestions, getRelatedPosts, getSlotPost } from "@/lib/site/data";
import { buildCountryFaq } from "@/lib/site/exam-describe";

function crumbs(code: CountryCode, slug: string): Crumb[] {
  const hub = hubPage(code);
  const def = getCountryPage(code, slug)!;
  return [
    { name: "Home", path: "/" },
    { name: COUNTRY_NAMES[code], path: hubPath(code) },
    ...(def.kind === "hub" ? [] : [{ name: def.label, path: countryPagePath(code, slug) }]),
  ].map((c, i, all) => (i === 1 && all.length === 2 ? { ...c, name: hub.label } : c));
}

async function RelatedPosts({ code }: { code: CountryCode }) {
  const posts = await getRelatedPosts(code);
  if (posts.length === 0) return null;
  return (
    <section aria-labelledby="related-heading">
      <h2 id="related-heading" className="mb-3 text-2xl font-bold">
        Related guides
      </h2>
      <ul className="list-disc space-y-1 pl-6">
        {posts.map((p) => (
          <li key={p.slug}>
            <Link href={p.path} className="link">
              {p.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PageNav({ code, current }: { code: CountryPageViewProps["code"]; current: string }) {
  return (
    <nav aria-label={`${COUNTRY_NAMES[code]} pages`} className="mb-6 flex flex-wrap gap-2">
      {COUNTRY_PAGES[code].map((p) => (
        <Link
          key={p.slug}
          href={countryPagePath(code, p.slug)}
          className={`btn btn-sm ${p.slug === current ? "btn-primary" : "btn-outline"}`}
          aria-current={p.slug === current ? "page" : undefined}
        >
          {p.label}
        </Link>
      ))}
    </nav>
  );
}

type CountryPageViewProps = { code: CountryCode; slug: string };

async function Hub({ code, slug }: CountryPageViewProps) {
  const [data, slot] = await Promise.all([getCountryData(code), getSlotPost(code, slug)]);
  const { summary } = data;
  const faq = buildCountryFaq({
    countryName: summary.name === "United Kingdom" ? "the United Kingdom" : summary.name,
    testName: summary.testName,
    version: summary.version,
    officialUrl: summary.officialSourceUrl,
  });
  const body = slot ? addHeadingIds(slot.body) : null;
  const toc = [
    { id: "exam-format", text: "Exam format" },
    ...(data.chapters.length ? [{ id: "chapters", text: "What the test covers" }] : []),
    ...(body?.toc ?? []),
    { id: "faq", text: "FAQ" },
  ];
  return (
    <main className="space-y-8">
      <div>
        <Breadcrumbs items={crumbs(code, slug)} />
        <h1 className="mb-3 text-3xl font-bold">
          {summary.testName}: rules, format and free practice
        </h1>
        <p>
          The {summary.testName} for {summary.name} has{" "}
          {summary.description.questions.toLowerCase()}, and the pass mark is{" "}
          {summary.description.passMark}. Practise with free tests that follow the same rules.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={`/${code}/practice-test`} className="btn btn-primary">
            Start free test
          </Link>
          <Link
            href={countryPagePath(
              code,
              COUNTRY_PAGES[code].find((p) => p.kind === "questions")!.slug,
            )}
            className="btn btn-outline"
          >
            Browse questions
          </Link>
        </div>
        <Toc items={toc} />
      </div>
      <PageNav code={code} current={slug} />
      <section id="exam-format" aria-labelledby="exam-format-heading" className="scroll-mt-20">
        <h2 id="exam-format-heading" className="mb-3 text-2xl font-bold">
          Exam format
        </h2>
        <ExamFacts summary={summary} />
      </section>
      {data.chapters.length > 0 && (
        <section id="chapters" aria-labelledby="chapters-heading" className="scroll-mt-20">
          <h2 id="chapters-heading" className="mb-3 text-2xl font-bold">
            What the test covers
          </h2>
          <ul className="list-disc space-y-1 pl-6">
            {data.chapters.map((c) => (
              <li key={c.slug}>
                {c.title} ({c.questionCount} practice question{c.questionCount === 1 ? "" : "s"})
              </li>
            ))}
          </ul>
        </section>
      )}
      {body && <Prose html={body.html} />}
      <OfficialSource summary={summary} />
      <Faq items={faq} />
      <RelatedPosts code={code} />
    </main>
  );
}

async function Questions({ code, slug }: CountryPageViewProps) {
  const [bank, data] = await Promise.all([getCountryQuestions(code), getCountryData(code)]);
  const name = COUNTRY_NAMES[code];
  return (
    <main className="space-y-8">
      <div>
        <Breadcrumbs items={crumbs(code, slug)} />
        <h1 className="mb-3 text-3xl font-bold">{name} citizenship test questions and answers</h1>
        <p>
          {data.questionCount} practice question{data.questionCount === 1 ? "" : "s"} for the{" "}
          {data.summary.testName}, grouped by chapter, with answers and the source each one comes
          from.
        </p>
        {code === "us" && (
          <p className="mt-2 text-sm">
            Some US answers depend on your state (for example your governor and senators). Check the
            current officials on the official USCIS page.
          </p>
        )}
        <Link href={`/${code}/practice-test`} className="btn btn-primary mt-4">
          Take a free practice test
        </Link>
        <Toc items={bank.chapters.map((c) => ({ id: c.slug, text: c.title }))} />
      </div>
      <PageNav code={code} current={slug} />
      {bank.chapters.length === 0 && <p>No questions have been published yet.</p>}
      {bank.chapters.map((c) => (
        <section key={c.slug} id={c.slug} aria-labelledby={`${c.slug}-h`} className="scroll-mt-20">
          <h2 id={`${c.slug}-h`} className="mb-3 text-2xl font-bold">
            {c.title}
          </h2>
          <ol className="space-y-4">
            {c.questions.map((q) => (
              <li key={q.id} className="ml-5 list-decimal">
                <p className="font-medium">{q.prompt}</p>
                <p>
                  <span className="font-semibold">Answer:</span> {q.answer}
                </p>
                {q.explanation && <p className="text-sm">{q.explanation}</p>}
                <p className="text-sm opacity-80">Source: {q.sourceRef}</p>
              </li>
            ))}
          </ol>
        </section>
      ))}
      <OfficialSource summary={data.summary} />
    </main>
  );
}

async function Content({ code, slug }: CountryPageViewProps) {
  const def = getCountryPage(code, slug)!;
  const [data, slot] = await Promise.all([getCountryData(code), getSlotPost(code, slug)]);
  const body = slot ? addHeadingIds(slot.body) : null;
  return (
    <main className="space-y-8">
      <div>
        <Breadcrumbs items={crumbs(code, slug)} />
        <h1 className="mb-3 text-3xl font-bold">{def.title(COUNTRY_NAMES[code])}</h1>
        {body ? (
          <Toc items={body.toc} />
        ) : (
          <p>
            This guide is being written. In the meantime the official source below has the current
            rules, and you can practise with a free test.
          </p>
        )}
      </div>
      <PageNav code={code} current={slug} />
      {body && <Prose html={body.html} />}
      <Link href={`/${code}/practice-test`} className="btn btn-primary w-fit">
        Start free test
      </Link>
      <OfficialSource summary={data.summary} />
      <RelatedPosts code={code} />
    </main>
  );
}

/** Server view for `/[country]/[page]`. The caller has already validated both params. */
export async function CountryPageView({ code, slug }: CountryPageViewProps) {
  await connection();
  const kind = getCountryPage(code, slug)!.kind;
  if (kind === "hub") return <Hub code={code} slug={slug} />;
  if (kind === "questions") return <Questions code={code} slug={slug} />;
  return <Content code={code} slug={slug} />;
}
