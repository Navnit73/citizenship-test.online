import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listGuestAttempts } from "@/lib/guest";
import { choice, exam, text } from "./fixtures";
import { TestPlayer } from "./TestPlayer";

beforeEach(() => localStorage.clear());
afterEach(() => vi.useRealTimers());

describe("TestPlayer", () => {
  it("shows an error with retry when loading fails", async () => {
    const loadExam = vi
      .fn()
      .mockRejectedValueOnce(new Error("x"))
      .mockResolvedValueOnce(exam([choice]));
    render(<TestPlayer country="uk" loadExam={loadExam} />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn.t load/i);
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByRole("button", { name: /start test/i })).toBeInTheDocument();
  });

  it("runs a full test, shows results and saves the attempt locally", async () => {
    render(<TestPlayer country="uk" loadExam={async () => exam([choice, text])} />);
    await userEvent.click(await screen.findByRole("button", { name: /start test/i }));

    await userEvent.click(screen.getByLabelText("1066"));
    await userEvent.click(screen.getByRole("button", { name: /submit answer/i }));
    expect(screen.getByRole("status")).toHaveTextContent(/correct/i);
    await userEvent.click(screen.getByRole("button", { name: /next question/i }));
    expect(screen.getByText(/1 of 1 correct so far/i)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/your answer/i), "constitution{Enter}");
    await userEvent.click(screen.getByRole("button", { name: /see my results/i }));

    expect(await screen.findByRole("heading", { name: /you passed/i })).toBeInTheDocument();
    const saved = listGuestAttempts();
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      countryCode: "uk",
      score: 2,
      total: 2,
      passed: true,
      mode: "read",
    });
  });

  it("explains the pass mark before starting", async () => {
    render(<TestPlayer country="uk" loadExam={async () => exam([choice, text])} />);
    expect(await screen.findByText(/answer/i, { selector: "p" })).toHaveTextContent(
      /2 questions.*at least 2 right/i,
    );
  });

  it("shows the right answer and explanation after a wrong answer", async () => {
    render(<TestPlayer country="uk" loadExam={async () => exam([choice, text])} />);
    await userEvent.click(await screen.findByRole("button", { name: /start test/i }));
    await userEvent.click(screen.getByLabelText("1215"));
    await userEvent.click(screen.getByRole("button", { name: /submit answer/i }));
    const feedback = screen.getByRole("status");
    expect(feedback).toHaveTextContent(/not quite/i);
    expect(feedback).toHaveTextContent(/correct answer:\s*1066/i);
    expect(screen.getByLabelText("1215")).toBeDisabled();
  });

  it("skips per-question feedback in exam conditions", async () => {
    render(<TestPlayer country="uk" loadExam={async () => exam([choice, text])} />);
    await userEvent.click(
      await screen.findByRole("checkbox", { name: /show the correct answer after each/i }),
    );
    await userEvent.click(screen.getByRole("button", { name: /start test/i }));
    await userEvent.click(screen.getByLabelText("1066"));
    await userEvent.click(screen.getByRole("button", { name: /submit answer/i }));
    expect(screen.queryByRole("button", { name: /next question/i })).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/your answer/i), "constitution{Enter}");
    expect(await screen.findByRole("heading", { name: /you passed/i })).toBeInTheDocument();
  });

  it("lets the learner pick a study mode before starting", async () => {
    render(<TestPlayer country="uk" loadExam={async () => exam([text])} />);
    await userEvent.click(await screen.findByRole("radio", { name: /read aloud/i }));
    await userEvent.click(screen.getByRole("button", { name: /start test/i }));
    await userEvent.type(screen.getByLabelText(/your answer/i), "constitution{Enter}");
    await userEvent.click(screen.getByRole("button", { name: /see my results/i }));
    await waitFor(() => expect(listGuestAttempts()[0]?.mode).toBe("listen"));
  });

  it("shows a countdown and auto-submits when time runs out", async () => {
    vi.useFakeTimers();
    render(<TestPlayer country="uk" loadExam={async () => exam([choice, text], 3)} />);
    await act(async () => {});
    fireEvent.click(screen.getByRole("button", { name: /start test/i }));
    expect(screen.getByRole("timer")).toHaveTextContent("0:03");
    act(() => {
      vi.advanceTimersByTime(3500);
    });
    expect(screen.getByText(/time ran out/i)).toBeInTheDocument();
  });

  it("offers a retry that loads a fresh exam", async () => {
    const loadExam = vi.fn(async () => exam([choice]));
    render(<TestPlayer country="uk" loadExam={loadExam} />);
    await userEvent.click(await screen.findByRole("button", { name: /start test/i }));
    await userEvent.click(screen.getByLabelText("1066"));
    await userEvent.click(screen.getByRole("button", { name: /submit answer/i }));
    await userEvent.click(screen.getByRole("button", { name: /see my results/i }));
    await userEvent.click(await screen.findByRole("button", { name: /take another test/i }));
    await waitFor(() => expect(loadExam).toHaveBeenCalledTimes(2));
  });

  it("handles an empty question bank gracefully", async () => {
    render(<TestPlayer country="uk" loadExam={async () => exam([])} />);
    expect(await screen.findByText(/no questions available/i)).toBeInTheDocument();
  });
});
