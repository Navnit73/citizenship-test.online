import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ModeDemo } from "./ModeDemo";

describe("ModeDemo", () => {
  it("lets a visitor try three questions and shows a summary", async () => {
    render(<ModeDemo />);
    expect(screen.getByText(/question 1 of 3/i)).toBeInTheDocument();
    for (let i = 0; i < 3; i++) {
      const radios = screen
        .queryAllByRole("radio")
        .filter((r) => r.getAttribute("name")?.startsWith("q-"));
      if (radios.length) await userEvent.click(radios[0]);
      else await userEvent.type(screen.getByLabelText(/your answer/i), "x");
      await userEvent.click(screen.getByRole("button", { name: /submit answer/i }));
    }
    expect(await screen.findByText(/you got \d of 3/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(screen.getByText(/question 1 of 3/i)).toBeInTheDocument();
  });
  it("offers the three study modes", () => {
    render(<ModeDemo />);
    for (const name of [/read/i, /listen/i, /write/i]) {
      expect(screen.getByRole("radio", { name })).toBeInTheDocument();
    }
  });
});
