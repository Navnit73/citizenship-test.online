import { beforeEach, describe, expect, it } from "vitest";
import { getConsent, setConsent } from "./consent";

beforeEach(() => localStorage.clear());

describe("consent", () => {
  it("is undecided until the visitor chooses", () => {
    expect(getConsent()).toBeNull();
  });
  it("stores accept and reject", () => {
    setConsent(true);
    expect(getConsent()).toEqual({ analytics: true });
    setConsent(false);
    expect(getConsent()).toEqual({ analytics: false });
  });
  it("treats corrupt storage as undecided", () => {
    localStorage.setItem("ct.consent", "{oops");
    expect(getConsent()).toBeNull();
    localStorage.setItem("ct.consent", JSON.stringify({ analytics: "yes" }));
    expect(getConsent()).toBeNull();
  });
  it("never throws when storage is blocked", () => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error("denied");
    };
    expect(() => setConsent(true)).not.toThrow();
    Storage.prototype.setItem = orig;
  });
});
