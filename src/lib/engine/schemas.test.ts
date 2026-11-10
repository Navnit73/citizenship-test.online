import { describe, expect, it } from "vitest";
import { examConfigSchema } from "./schemas";

const version = {
  key: "uk",
  questionsAsked: 24,
  poolSize: 100,
  passRule: { type: "percent", value: 75 },
  stopWhenPassed: false,
};

describe("examConfigSchema", () => {
  it("accepts a valid config", () => {
    expect(examConfigSchema.safeParse({ versions: [version], activeVersion: "uk" }).success).toBe(
      true,
    );
  });
  it("rejects an unknown activeVersion", () => {
    expect(examConfigSchema.safeParse({ versions: [version], activeVersion: "x" }).success).toBe(
      false,
    );
  });
  it("rejects percent over 100", () => {
    const bad = { ...version, passRule: { type: "percent", value: 120 } };
    expect(examConfigSchema.safeParse({ versions: [bad], activeVersion: "uk" }).success).toBe(
      false,
    );
  });
});
