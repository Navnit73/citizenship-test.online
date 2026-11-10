import { expect, test } from "@playwright/test";
import { completeTest, expectNoA11yViolations } from "./helpers";

test("home page has no accessibility violations", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectNoA11yViolations(page);
});

test("guest takes a UK mock test, sees results, and the attempt is saved locally", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: /united kingdom practice test/i }).click();

  await page.getByRole("button", { name: /start test/i }).click();
  await expect(page.getByRole("timer")).toBeVisible();
  await expectNoA11yViolations(page);

  await completeTest(page);
  await expectNoA11yViolations(page);

  const attempts = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("ct.guest.attempts") ?? "[]"),
  );
  expect(attempts).toHaveLength(1);
  expect(attempts[0].countryCode).toBe("uk");
});

for (const country of ["us", "uk", "ca", "au"]) {
  test(`guest can complete a ${country.toUpperCase()} test`, async ({ page }) => {
    await page.goto(`/${country}/practice-test`);
    await page.getByRole("button", { name: /start test/i }).click();
    await completeTest(page);
    await expect(page.getByRole("table", { name: /score by chapter/i })).toBeVisible();
  });
}

test("listen mode offers audio controls or a clear fallback", async ({ page }) => {
  await page.goto("/uk/practice-test");
  await page.getByRole("radio", { name: "Listen" }).check();
  await page.getByRole("button", { name: /start test/i }).click();
  await expect(
    page
      .getByRole("button", { name: /play question/i })
      .or(page.getByText(/audio isn.t supported/i)),
  ).toBeVisible();
  await expectNoA11yViolations(page);
});

test("unknown country 404s", async ({ page }) => {
  const res = await page.goto("/fr/practice-test");
  expect(res?.status()).toBe(404);
});
