import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { getConsent } from "@/lib/consent";
import { CookieBanner, CookieSettingsButton } from "./CookieBanner";

beforeEach(() => localStorage.clear());

describe("CookieBanner", () => {
  it("asks for consent and gives accept and reject equal prominence", async () => {
    render(<CookieBanner />);
    const region = await screen.findByRole("region", { name: /cookie/i });
    expect(region).toBeInTheDocument();
    const accept = screen.getByRole("button", { name: /accept/i });
    const reject = screen.getByRole("button", { name: /reject/i });
    expect(accept.className).toBe(reject.className); // no dark pattern
  });
  it("stores acceptance and hides", async () => {
    render(<CookieBanner />);
    await userEvent.click(await screen.findByRole("button", { name: /accept/i }));
    expect(getConsent()).toEqual({ analytics: true });
    expect(screen.queryByRole("region", { name: /cookie/i })).not.toBeInTheDocument();
  });
  it("stores rejection and hides", async () => {
    render(<CookieBanner />);
    await userEvent.click(await screen.findByRole("button", { name: /reject/i }));
    expect(getConsent()).toEqual({ analytics: false });
    expect(screen.queryByRole("region", { name: /cookie/i })).not.toBeInTheDocument();
  });
  it("stays hidden when a choice was already made, and can be reopened", async () => {
    localStorage.setItem("ct.consent", JSON.stringify({ analytics: false }));
    render(
      <>
        <CookieBanner />
        <CookieSettingsButton />
      </>,
    );
    expect(screen.queryByRole("region", { name: /cookie/i })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /cookie settings/i }));
    expect(await screen.findByRole("region", { name: /cookie/i })).toBeInTheDocument();
  });
});
