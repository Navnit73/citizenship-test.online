import { describe, expect, it, vi } from "vitest";
import { parseEnv } from "./env";

describe("parseEnv", () => {
  it("accepts a valid environment", () => {
    const env = parseEnv({
      MONGODB_URI: "mongodb://localhost:27017/citizenship",
      NODE_ENV: "test",
    });
    expect(env.MONGODB_URI).toBe("mongodb://localhost:27017/citizenship");
  });

  it("throws a readable error when MONGODB_URI is missing", () => {
    expect(() => parseEnv({ NODE_ENV: "test" })).toThrow(/MONGODB_URI/);
  });

  it("rejects a non-mongodb URI", () => {
    expect(() => parseEnv({ MONGODB_URI: "http://example.com", NODE_ENV: "test" })).toThrow(
      /MONGODB_URI/,
    );
  });
});

describe("getEnv", () => {
  it("reads and caches process.env", async () => {
    vi.resetModules();
    vi.stubEnv("MONGODB_URI", "mongodb://localhost:27017/x");
    const { getEnv } = await import("./env");
    expect(getEnv()).toBe(getEnv());
    vi.unstubAllEnvs();
  });
});
