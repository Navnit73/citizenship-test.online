import { defineConfig, devices } from "@playwright/test";
import { E2E_PASSWORD, E2E_PORT, E2E_URL } from "./tests/e2e/constants";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: { baseURL: E2E_URL, trace: "on-first-retry" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm run build && npx tsx scripts/e2e-server.ts",
    url: E2E_URL,
    env: {
      ENABLE_TEST_LOGIN: "true",
      TEST_LOGIN_PASSWORD: E2E_PASSWORD,
      AUTH_SECRET: "e2e-auth-secret-not-for-production-use-0123456789",
      AUTH_TRUST_HOST: "true",
      AUTH_URL: E2E_URL,
      SITE_URL: E2E_URL,
      PORT: String(E2E_PORT),
    },
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
