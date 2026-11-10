import { expect, type Page } from "@playwright/test";
import { E2E_PASSWORD, USERS } from "./constants";

export async function loginAs(page: Page, role: keyof typeof USERS, callbackUrl = "/") {
  await page.goto(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  const form = page
    .getByRole("form", { name: /test login/i })
    .or(page.locator("form", { hasText: "Test login" }));
  await form.getByLabel("Test email").fill(USERS[role]);
  await form.getByLabel("Test password").fill(E2E_PASSWORD);
  await form.getByRole("button", { name: /sign in \(test\)/i }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

export const unique = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
