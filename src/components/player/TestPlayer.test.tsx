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
    await userEvent.type(screen.getByLabelText(/your answer/i), "constitution{Enter}");

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

  it("lets the learner pick a study mode before starting", async () => {
    render(<TestPlayer country="uk" loadExam={async () => exam([text])} />);
    await userEvent.click(await screen.findByRole("radio", { name: /write/i }));
    await userEvent.click(screen.getByRole("button", { name: /start test/i }));
    await userEvent.type(screen.getByLabelText(/your answer/i), "constitution{Enter}");
    await waitFor(() => expect(listGuestAttempts()[0]?.mode).toBe("write"));
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
    await userEvent.click(await screen.findByRole("button", { name: /take another test/i }));
    await waitFor(() => expect(loadExam).toHaveBeenCalledTimes(2));
  });

  it("handles an empty question bank gracefully", async () => {
    render(<TestPlayer country="uk" loadExam={async () => exam([])} />);
    expect(await screen.findByText(/no questions available/i)).toBeInTheDocument();
  });
});
