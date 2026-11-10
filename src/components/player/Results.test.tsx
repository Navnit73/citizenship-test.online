import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { startSession, submitAnswer, expireSession } from "@/lib/engine/session";
import { choice, exam, text } from "./fixtures";
import { Results } from "./Results";

function finished(answers: (string[] | string)[]) {
  const e = exam([choice, text]);
  let s = startSession(e.version, e.questions, 0);
  answers.forEach((a, i) => (s = submitAnswer(s, a, 100, i + 1)));
  return s;
}

describe("Results", () => {
  it("shows a pass with score and chapter breakdown", () => {
    render(<Results session={finished([["a"], "the constitution"])} onRetry={() => {}} />);
    expect(screen.getByRole("heading", { name: /you passed/i })).toBeInTheDocument();
    expect(screen.getByText(/^Score:/)).toHaveTextContent("2 / 2");
    expect(screen.getByRole("table", { name: /by chapter/i })).toBeInTheDocument();
  });

  it("shows a fail and reviews wrong answers with the correct one and explanation", () => {
    render(<Results session={finished([["b"], "the constitution"])} onRetry={() => {}} />);
    expect(screen.getByRole("heading", { name: /did not pass/i })).toBeInTheDocument();
    expect(screen.getByText("It was 1066.")).toBeInTheDocument();
    expect(screen.getByText(/handbook ch\.1/i)).toBeInTheDocument();
  });

  it("explains a timeout", () => {
    const e = exam([choice, text]);
    const s = expireSession(startSession(e.version, e.questions, 0), 99);
    render(<Results session={s} onRetry={() => {}} />);
    expect(screen.getByText(/time ran out/i)).toBeInTheDocument();
  });
});
