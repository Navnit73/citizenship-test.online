import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export async function expectNoA11yViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    violations,
    JSON.stringify(violations.map((v) => ({ id: v.id, n: v.nodes.length }))),
  ).toEqual([]);
}

/** Answers whatever question is on screen, then submits. */
export async function answerCurrentQuestion(page: Page) {
  const choice = page.getByRole("radio").or(page.getByRole("checkbox"));
  const textbox = page.getByRole("textbox", { name: /your answer/i });
  if (await textbox.count()) await textbox.fill("not sure");
  else await choice.first().check();
  await page.getByRole("button", { name: /submit answer/i }).click();
}

export async function completeTest(page: Page) {
  const results = page.getByRole("heading", { name: /you passed|you did not pass/i });
  for (let i = 0; i < 60; i++) {
    if (await results.isVisible()) return;
    await page
      .getByRole("button", { name: /submit answer/i })
      .waitFor({ timeout: 5000 })
      .catch(() => {});
    if (await results.isVisible()) return;
    await answerCurrentQuestion(page);
  }
  await expect(results).toBeVisible();
}
