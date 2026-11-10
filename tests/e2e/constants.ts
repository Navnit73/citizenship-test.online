export const E2E_PORT = 3100;
export const E2E_URL = `http://localhost:${E2E_PORT}`;
/** Test-only credentials. The app refuses test login in Vercel production regardless. */
export const E2E_PASSWORD = "e2e-only-password-123";
export const USERS = {
  admin: "admin@e2e.test",
  editor: "editor@e2e.test",
  author: "author@e2e.test",
  user: "user@e2e.test",
} as const;
