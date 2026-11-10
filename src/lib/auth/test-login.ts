import { timingSafeEqual } from "node:crypto";

type Env = Record<string, string | undefined>;

/**
 * Password login for automated tests only. Needs an explicit flag AND a strong
 * password, and is hard-disabled in Vercel production.
 */
export function testLoginEnabled(env: Env = process.env): boolean {
  return (
    env.ENABLE_TEST_LOGIN === "true" &&
    (env.TEST_LOGIN_PASSWORD?.length ?? 0) >= 12 &&
    env.VERCEL_ENV !== "production"
  );
}

export function verifyTestPassword(given: unknown, expected: string): boolean {
  if (typeof given !== "string") return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
