import { describe, expect, it } from "vitest";
import { COUNTRY_CODES, COUNTRY_NAMES, isCountryCode } from "./countries";

describe("countries", () => {
  it("lists the four supported countries", () => {
    expect(COUNTRY_CODES.sort()).toEqual(["au", "ca", "uk", "us"]);
    expect(COUNTRY_NAMES.uk).toBe("United Kingdom");
  });
  it("narrows valid codes only", () => {
    expect(isCountryCode("us")).toBe(true);
    expect(isCountryCode("fr")).toBe(false);
    expect(isCountryCode("toString")).toBe(false);
  });
});
