import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CountrySummary } from "@/lib/site/data";
import { describeExam } from "@/lib/site/exam-describe";
import { Breadcrumbs } from "./Breadcrumbs";
import { CountryCards } from "./CountryCards";
import { ExamFacts, OfficialSource } from "./ExamFacts";
import { Faq } from "./Faq";
import { JsonLd } from "./JsonLd";
import { Toc } from "./Toc";

const version = {
  key: "uk",
  questionsAsked: 24,
  poolSize: 1000,
  passRule: { type: "percent" as const, value: 75 },
  stopWhenPassed: false,
  timeLimitSec: 2700,
};
const summary: CountrySummary = {
  code: "uk",
  name: "United Kingdom",
  testName: "Life in the UK Test",
  version,
  description: describeExam({
    ...version,
    requiredTags: [{ tag: "values", mustAllBeCorrect: true }],
  }),
  officialSourceUrl: "https://www.gov.uk/life-in-the-uk-test",
  lastReviewedAt: "2026-03-05T00:00:00.000Z",
};

const ldBlocks = (c: HTMLElement) =>
  [...c.querySelectorAll('script[type="application/ld+json"]')].map((s) =>
    JSON.parse(s.textContent!),
  );

describe("Breadcrumbs", () => {
  it("links all but the current page and emits BreadcrumbList", () => {
    const { container } = render(
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "UK", path: "/uk/life-in-the-uk-test" },
          { name: "Practice", path: "/uk/practice-test" },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("link", { name: "Practice" })).not.toBeInTheDocument();
    expect(screen.getByText("Practice")).toHaveAttribute("aria-current", "page");
    expect(ldBlocks(container)[0]["@type"]).toBe("BreadcrumbList");
  });
});

describe("Faq", () => {
  it("renders every question and matching FAQPage markup", () => {
    const { container } = render(
      <Faq
        items={[
          { q: "Free?", a: "Yes." },
          { q: "Official?", a: "No." },
        ]}
      />,
    );
    expect(screen.getAllByRole("group").length).toBe(2); // <details>
    expect(screen.getByText("Free?")).toBeInTheDocument();
    expect(ldBlocks(container)[0].mainEntity).toHaveLength(2);
  });
});

describe("JsonLd", () => {
  it("cannot be broken out of by hostile strings", () => {
    const { container } = render(<JsonLd data={{ x: "</script><img src=x onerror=alert(1)>" }} />);
    expect(container.querySelectorAll("script")).toHaveLength(1);
    expect(container.innerHTML).not.toContain("<img");
  });
});

describe("Toc", () => {
  it("renders anchors, and nothing for fewer than two entries", () => {
    const { container, rerender } = render(
      <Toc
        items={[
          { id: "a", text: "A" },
          { id: "b", text: "B" },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: "B" })).toHaveAttribute("href", "#b");
    rerender(<Toc items={[{ id: "a", text: "A" }]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("ExamFacts / OfficialSource", () => {
  it("shows rules and notes derived from the engine config", () => {
    render(<ExamFacts summary={summary} />);
    expect(screen.getByRole("table", { name: /at a glance/i })).toHaveTextContent("75% (18 of 24)");
    expect(screen.getByText(/every “values” question/i)).toBeInTheDocument();
  });
  it("links the official source safely and shows the review date", () => {
    render(<OfficialSource summary={summary} />);
    const link = screen.getByRole("link", { name: "www.gov.uk" });
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(screen.getByText(/Last reviewed: 5 March 2026/)).toBeInTheDocument();
  });
  it("omits the review line when never reviewed", () => {
    render(<OfficialSource summary={{ ...summary, lastReviewedAt: null }} />);
    expect(screen.queryByText(/Last reviewed/)).not.toBeInTheDocument();
  });
});

describe("CountryCards", () => {
  it("links to the hub and practice test, and badges only the suggested country", () => {
    render(
      <CountryCards
        countries={[
          summary,
          { ...summary, code: "us", name: "United States", testName: "US Citizenship Test" },
        ]}
        suggested="uk"
      />,
    );
    expect(screen.getAllByText("Suggested for you")).toHaveLength(1);
    expect(
      screen.getByRole("link", { name: "Start United Kingdom practice test" }),
    ).toHaveAttribute("href", "/uk/practice-test");
    expect(screen.getByRole("link", { name: "Life in the UK Test" })).toHaveAttribute(
      "href",
      "/uk/life-in-the-uk-test",
    );
  });
});
