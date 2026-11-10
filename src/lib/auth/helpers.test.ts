import { afterEach, describe, expect, it, vi } from "vitest";
import { buildMagicLinkMessage, sendMagicLink } from "./email";
import { testLoginEnabled, verifyTestPassword } from "./test-login";
import { assertSameOrigin } from "@/lib/api/admin-route";
import { ForbiddenError } from "@/lib/cms/errors";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

afterEach(() => vi.unstubAllEnvs());

describe("testLoginEnabled", () => {
  it("is off by default", () => {
    expect(testLoginEnabled({})).toBe(false);
  });
  it("needs the flag and a strong password", () => {
    expect(testLoginEnabled({ ENABLE_TEST_LOGIN: "true" })).toBe(false);
    expect(testLoginEnabled({ ENABLE_TEST_LOGIN: "true", TEST_LOGIN_PASSWORD: "short" })).toBe(
      false,
    );
    expect(
      testLoginEnabled({
        ENABLE_TEST_LOGIN: "true",
        TEST_LOGIN_PASSWORD: "a-long-enough-password",
      }),
    ).toBe(true);
  });
  it("is never on in Vercel production", () => {
    expect(
      testLoginEnabled({
        ENABLE_TEST_LOGIN: "true",
        TEST_LOGIN_PASSWORD: "a-long-enough-password",
        VERCEL_ENV: "production",
      }),
    ).toBe(false);
  });
});

describe("verifyTestPassword", () => {
  it("compares in constant time and rejects mismatches or non-strings", () => {
    expect(verifyTestPassword("secret-secret-1", "secret-secret-1")).toBe(true);
    expect(verifyTestPassword("secret-secret-2", "secret-secret-1")).toBe(false);
    expect(verifyTestPassword("short", "secret-secret-1")).toBe(false);
    expect(verifyTestPassword(undefined, "secret-secret-1")).toBe(false);
  });
});

describe("magic link email", () => {
  it("builds a message containing the link and host", () => {
    const m = buildMagicLinkMessage("https://x.test/cb?token=1", "x.test");
    expect(m.subject).toContain("x.test");
    expect(m.text).toContain("https://x.test/cb?token=1");
    expect(m.html).toContain("https://x.test/cb?token=1");
  });
  it("escapes html in the host", () => {
    expect(buildMagicLinkMessage("https://a.test", "<b>x</b>").html).not.toContain("<b>x</b>");
  });
  it("logs the link in development when no email server is configured", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("EMAIL_SERVER", "");
    await sendMagicLink({ identifier: "a@b.test", url: "https://x.test/cb" });
    expect(warn.mock.calls.flat().join(" ")).toContain("https://x.test/cb");
    warn.mockRestore();
  });
  it("refuses to run unconfigured in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("EMAIL_SERVER", "");
    await expect(
      sendMagicLink({ identifier: "a@b.test", url: "https://x.test/cb" }),
    ).rejects.toThrow(/not configured/i);
  });
});

describe("assertSameOrigin", () => {
  const req = (method: string, origin?: string) =>
    new Request("https://site.test/api/admin/posts", { method, headers: origin ? { origin } : {} });
  it("allows safe methods and same-origin or origin-less mutations", () => {
    expect(() => assertSameOrigin(req("GET", "https://evil.test"))).not.toThrow();
    expect(() => assertSameOrigin(req("POST", "https://site.test"))).not.toThrow();
    expect(() => assertSameOrigin(req("POST"))).not.toThrow();
  });
  it("rejects cross-origin mutations", () => {
    expect(() => assertSameOrigin(req("POST", "https://evil.test"))).toThrow(ForbiddenError);
    expect(() => assertSameOrigin(req("DELETE", "null"))).toThrow(ForbiddenError);
  });
});
