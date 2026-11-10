import { describe, expect, it } from "vitest";
import { shouldLoadAnalytics } from "./analytics";

describe("shouldLoadAnalytics", () => {
  it("requires both an analytics id and explicit consent", () => {
    expect(shouldLoadAnalytics({ analytics: true }, "G-TEST")).toBe(true);
    expect(shouldLoadAnalytics({ analytics: false }, "G-TEST")).toBe(false);
    expect(shouldLoadAnalytics(null, "G-TEST")).toBe(false);
    expect(shouldLoadAnalytics({ analytics: true }, undefined)).toBe(false);
    expect(shouldLoadAnalytics({ analytics: true }, "")).toBe(false);
  });
  it("rejects ids that aren't a plausible measurement id", () => {
    expect(shouldLoadAnalytics({ analytics: true }, "G-TEST'><script>")).toBe(false);
  });
});
