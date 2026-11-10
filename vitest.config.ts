import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    testTimeout: 30_000,
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/components/**"],
      exclude: [
        "src/lib/**/*.test.ts",
        "src/lib/db/test-utils.ts",
        "src/lib/db/seed/data.ts",
        "src/components/**/fixtures.ts",
        // Covered by Playwright (needs a browser, DB and request context):
        "src/components/admin/**/*.tsx",
        "src/components/content/**",
        "src/components/LoginForm.tsx",
        "src/components/player/TestBySlug.tsx",
        "src/lib/cms/public.ts",
      ],
      thresholds: { "src/lib/**": { lines: 95 }, "src/components/**": { lines: 80 } },
    },
  },
});
