import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { choice, dictation, multi, text } from "./fixtures";
import { QuestionCard } from "./QuestionCard";

const base = { index: 0, total: 3, mode: "read" as const, autoPlay: false, speed: 1 };

describe("QuestionCard", () => {
  it("single choice: submit is disabled until an option is chosen, then sends ids", async () => {
    const onSubmit = vi.fn();
    render(<QuestionCard {...base} question={choice} onSubmit={onSubmit} />);
    expect(screen.getByRole("button", { name: /submit answer/i })).toBeDisabled();
    await userEvent.click(screen.getByLabelText("1066"));
    await userEvent.click(screen.getByRole("button", { name: /submit answer/i }));
    expect(onSubmit).toHaveBeenCalledWith(["a"]);
  });

  it("multiple choice: allows several selections and groups them with a legend", async () => {
    const onSubmit = vi.fn();
    render(<QuestionCard {...base} question={multi} onSubmit={onSubmit} />);
    expect(screen.getByRole("group", { name: /which two/i })).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Wales"));
    await userEvent.click(screen.getByLabelText("Scotland"));
    await userEvent.click(screen.getByRole("button", { name: /submit answer/i }));
    expect(onSubmit).toHaveBeenCalledWith(["a", "c"]);
  });

  it("short text: typed answer submitted with Enter", async () => {
    const onSubmit = vi.fn();
    render(<QuestionCard {...base} question={text} onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText(/your answer/i), "the constitution{Enter}");
    expect(onSubmit).toHaveBeenCalledWith("the constitution");
  });

  it("does not submit a blank text answer", async () => {
    const onSubmit = vi.fn();
    render(<QuestionCard {...base} question={text} onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText(/your answer/i), "   {Enter}");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows progress", () => {
    render(<QuestionCard {...base} index={1} total={3} question={choice} onSubmit={() => {}} />);
    expect(screen.getByText(/question 2 of 3/i)).toBeInTheDocument();
  });

  it("listen mode explains when speech is unavailable", () => {
    render(<QuestionCard {...base} mode="listen" question={choice} onSubmit={() => {}} />);
    expect(screen.getByText(/audio isn.t supported/i)).toBeInTheDocument();
  });

  it("listen mode offers playback and speed when speech is available", () => {
    vi.stubGlobal("speechSynthesis", { speak: vi.fn(), cancel: vi.fn() });
    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      class {
        constructor(public text: string) {}
      },
    );
    render(<QuestionCard {...base} mode="listen" question={choice} onSubmit={() => {}} />);
    expect(screen.getByRole("button", { name: /play question/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/speed/i)).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("write mode hides the dictation text and keeps a transcript for accessibility", () => {
    render(<QuestionCard {...base} mode="write" question={dictation} onSubmit={() => {}} />);
    expect(screen.queryByText(/white house/i)).not.toBeInTheDocument();
    expect(screen.getByText(/show transcript/i)).toBeInTheDocument();
  });
});
