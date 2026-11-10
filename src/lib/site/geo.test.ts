import { describe, expect, it } from "vitest";
import { suggestedCountry } from "./geo";

describe("suggestedCountry", () => {
  it("maps ISO country codes to our four countries", () => {
    expect(suggestedCountry("GB")).toBe("uk");
    expect(suggestedCountry("us")).toBe("us");
    expect(suggestedCountry("CA")).toBe("ca");
    expect(suggestedCountry("AU")).toBe("au");
  });
  it("returns null for unknown or missing codes", () => {
    expect(suggestedCountry("FR")).toBeNull();
    expect(suggestedCountry(null)).toBeNull();
    expect(suggestedCountry("")).toBeNull();
  });
});
