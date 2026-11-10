import { expect, test, type Page } from "@playwright/test";
import { loginAs, unique } from "./auth-helpers";
import { expectNoA11yViolations } from "./helpers";

const COUNTRY_URLS = [
  "/us/citizenship-test",
  "/us/practice-test",
  "/us/civics-questions",
  "/us/english-test",
  "/us/naturalization-guide",
  "/uk/life-in-the-uk-test",
  "/uk/practice-test",
  "/uk/questions",
  "/uk/study-guide",
  "/uk/how-to-book",
  "/uk/english-requirement",
  "/ca/citizenship-test",
  "/ca/practice-test",
  "/ca/questions",
  "/ca/study-guide",
  "/ca/how-to-apply",
  "/au/citizenship-test",
  "/au/practice-test",
  "/au/questions",
  "/au/study-guide",
  "/au/how-to-apply",
];

async function jsonLd(page: Page) {
  const raw = await page.locator('script[type="application/ld+json"]').allTextContents();
  return raw.map((t) => JSON.parse(t));
}
const types = (blocks: { "@type": string }[]) => blocks.map((b) => b["@type"]);

test.describe("home page", () => {
  test("has the spec'd sections, schema and no accessibility violations", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Pass your citizenship test",
    );
    await expect(page.getByRole("link", { name: "Start a free test" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Choose your country" })).toBeVisible();
    for (const name of [
      "US Citizenship Test",
      "Life in the UK Test",
      "Canadian Citizenship Test",
      "Australian Citizenship Test",
    ]) {
      await expect(page.getByRole("heading", { level: 3, name })).toBeVisible();
    }
    await expect(page.getByRole("heading", { name: "How it works" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Popular tests" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /latest guides/i })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /where our information comes from/i }),
    ).toBeVisible();
    await expect(page.locator("#faq details")).toHaveCount(6);
    expect(types(await jsonLd(page))).toEqual(expect.arrayContaining(["FAQPage", "Organization"]));
    await expectNoA11yViolations(page);
  });

  test("country cards show the rules from the database", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByText("24 questions · pass mark 75% (18 of 24) · 45 minutes"),
    ).toBeVisible();
    await expect(
      page.getByText("20 questions · pass mark 12 of 20 · No fixed time limit"),
    ).toBeVisible();
  });

  test("the study-mode demo works", async ({ page }) => {
    await page.goto("/");
    const demo = page
      .getByRole("heading", { name: "Read, Listen and Write" })
      .locator("xpath=ancestor::section");
    for (let i = 0; i < 3; i++) {
      const radio = demo.locator('input[name^="q-"]').first();
      if (await radio.count()) await radio.check();
      else await demo.getByLabel(/your answer/i).fill("the constitution");
      await demo.getByRole("button", { name: /submit answer/i }).click();
    }
    await expect(demo.getByText(/you got \d of 3/i)).toBeVisible();
  });

  test("the footer links to published legal pages", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Legal" })
      .getByRole("link", { name: "Disclaimer" })
      .click();
    await expect(page.getByRole("heading", { level: 1, name: "Disclaimer" })).toBeVisible();
    await expect(page.getByText(/not affiliated with, endorsed by/i)).toBeVisible();
  });
});

test.describe("country pages", () => {
  for (const url of COUNTRY_URLS) {
    test(`${url} renders with breadcrumbs, canonical and no a11y violations`, async ({ page }) => {
      const res = await page.goto(url);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toBeVisible();
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        new RegExp(`${url}$`),
      );
      expect(types(await jsonLd(page))).toContain("BreadcrumbList");
      await expectNoA11yViolations(page);
    });
  }

  test("a hub states the exam rules, the official source and has an FAQPage", async ({ page }) => {
    await page.goto("/uk/life-in-the-uk-test");
    const facts = page.getByRole("table", { name: /at a glance/i });
    await expect(facts).toContainText("24 questions");
    await expect(facts).toContainText("75% (18 of 24)");
    await expect(facts).toContainText("45 minutes");
    await expect(
      page.getByRole("complementary", { name: "Official source" }).getByRole("link"),
    ).toHaveAttribute("href", /gov\.uk/);
    expect(types(await jsonLd(page))).toContain("FAQPage");
    await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);
  });

  test("the AU hub explains the values rule", async ({ page }) => {
    await page.goto("/au/citizenship-test");
    await expect(page.getByText(/every “values” question correctly/i).first()).toBeVisible();
  });

  test("the questions page lists answers with sources", async ({ page }) => {
    await page.goto("/uk/questions");
    await expect(page.getByText("In which year was the Battle of Hastings?")).toBeVisible();
    await expect(page.getByText("Answer: 1066")).toBeVisible();
    await expect(page.getByText(/Source: Life in the UK handbook/).first()).toBeVisible();
  });

  test("practice pages carry Quiz markup without exposing answers", async ({ page }) => {
    await page.goto("/uk/practice-test");
    const quiz = (await jsonLd(page)).find((b) => b["@type"] === "Quiz");
    expect(quiz).toBeTruthy();
    expect(JSON.stringify(quiz)).not.toContain("1066");
    await expect(page.getByRole("button", { name: /start test/i })).toBeVisible();
  });

  test("unwritten long-form pages are noindexed", async ({ page }) => {
    await page.goto("/au/how-to-apply");
    await expect(page.getByText(/guide is being written/i)).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("/uk permanently redirects to the hub; unknown pages 404", async ({ request }) => {
    const redirect = await request.get("/uk", { maxRedirects: 0 });
    expect(redirect.status()).toBe(308);
    expect(redirect.headers()["location"]).toContain("/uk/life-in-the-uk-test");
    expect((await request.get("/uk/nope")).status()).toBe(404);
    expect((await request.get("/fr/citizenship-test")).status()).toBe(404);
  });
});

test.describe("cookie consent", () => {
  test("asks first, loads no analytics, and remembers the choice", async ({ page }) => {
    const analyticsRequests: string[] = [];
    page.on(
      "request",
      (r) => /googletagmanager|google-analytics/.test(r.url()) && analyticsRequests.push(r.url()),
    );
    await page.goto("/");
    const banner = page.getByRole("region", { name: "Cookie consent" });
    await expect(banner).toBeVisible();
    await expectNoA11yViolations(page);

    await banner.getByRole("button", { name: "Reject analytics" }).click();
    await expect(banner).toBeHidden();
    await page.reload();
    await expect(page.getByRole("region", { name: "Cookie consent" })).toBeHidden();

    await page.getByRole("button", { name: "Cookie settings" }).click();
    await expect(page.getByRole("region", { name: "Cookie consent" })).toBeVisible();
    await page.getByRole("button", { name: "Accept analytics" }).click();
    expect(await page.evaluate(() => localStorage.getItem("ct.consent"))).toBe(
      '{"analytics":true}',
    );
    expect(analyticsRequests).toEqual([]); // no GA id configured, and never before consent
  });
});

test.describe("CMS-driven pages and cache refresh", () => {
  test.skip(({ isMobile }) => isMobile, "CMS journeys run on desktop");

  test("a CMS page fills a country page, with a TOC, and stays out of the duplicate URL", async ({
    page,
    request,
  }) => {
    await loginAs(page, "editor", "/admin/posts/new");
    await page.getByLabel(/^Type/).selectOption("page");
    await page.getByLabel(/^Title/).fill("How to apply for Canadian citizenship");
    await page.getByLabel(/^Slug/).fill("ca-how-to-apply");
    await page.getByRole("textbox", { name: "Body" }).click();
    await page.getByRole("button", { name: "H2" }).click();
    await expect(page.getByRole("textbox", { name: "Body" })).toBeFocused();
    await page.keyboard.type("Before you apply");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Check the official eligibility rules first.");
    await page.getByRole("button", { name: "H2" }).click();
    await expect(page.getByRole("textbox", { name: "Body" })).toBeFocused();
    await page.keyboard.type("Prepare your documents");
    await page.getByLabel(/^Status/).selectOption("published");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page).toHaveURL(/\/admin\/posts\/[a-f0-9]{24}/);

    await page.goto("/ca/how-to-apply");
    await expect(page.getByRole("heading", { level: 2, name: "Before you apply" })).toBeVisible();
    await expect(
      page
        .getByRole("navigation", { name: "On this page" })
        .getByRole("link", { name: "Prepare your documents" }),
    ).toBeVisible();
    await expect(page.getByText(/guide is being written/i)).toHaveCount(0);
    await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);
    await expectNoA11yViolations(page);

    await page.goto("/p/ca-how-to-apply");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/ca\/how-to-apply$/,
    );

    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/ca/how-to-apply");
    expect(sitemap).not.toContain("/p/ca-how-to-apply");
  });

  test("publishing refreshes cached pages immediately", async ({ page }) => {
    const title = unique("Fresh UK Guide");
    await loginAs(page, "editor", "/admin/posts/new");
    // Warm the caches first so a stale copy would be served if invalidation failed.
    await page.goto("/uk/life-in-the-uk-test");
    await page.goto("/guides");
    await page.goto("/admin/posts/new");

    await page.getByLabel(/^Type/).selectOption("guide");
    await page.getByLabel(/^Country/).selectOption("uk");
    await page.getByLabel(/^Title/).fill(title);
    await page.getByRole("textbox", { name: "Body" }).click();
    await page.keyboard.type("Fresh content");
    await page.getByLabel(/^Status/).selectOption("published");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page).toHaveURL(/\/admin\/posts\/[a-f0-9]{24}/);

    await page.goto("/uk/life-in-the-uk-test");
    await expect(page.getByRole("link", { name: title })).toBeVisible();
    await page.goto("/guides");
    await expect(page.getByRole("link", { name: title })).toBeVisible();
    await page.goto("/");
    await expect(page.getByRole("link", { name: title })).toBeVisible();
  });

  test("importing a question refreshes the question page", async ({ page }) => {
    const prompt = unique("Which river flows through London?");
    await loginAs(page, "editor");
    await page.goto("/uk/questions"); // warm the cache
    const res = await page.request.post("/api/admin/questions/import", {
      data: {
        rows: [
          {
            countryCode: "uk",
            versions: ["3rd-edition"],
            chapter: "what-is-the-uk",
            type: "single",
            prompt,
            options: [
              { id: "a", text: "Thames" },
              { id: "b", text: "Severn" },
            ],
            correctOptionIds: ["a"],
            sourceRef: "Life in the UK handbook",
            status: "published",
          },
        ],
      },
    });
    expect((await res.json()).created).toBe(1);
    await page.goto("/uk/questions");
    await expect(page.getByText(prompt)).toBeVisible();
  });
});

test.describe("crawler files", () => {
  test("sitemap lists country pages but not unwritten long-form ones", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    for (const path of [
      "/uk/life-in-the-uk-test",
      "/us/civics-questions",
      "/au/practice-test",
      "/ca/questions",
      "/legal/disclaimer",
    ]) {
      expect(xml).toContain(path);
    }
    expect(xml).not.toContain("/au/how-to-apply");
    expect(xml).not.toContain("/admin");
  });

  test("robots.txt blocks private areas and points at the sitemap", async ({ request }) => {
    const txt = await (await request.get("/robots.txt")).text();
    expect(txt).toContain("Disallow: /admin");
    expect(txt).toContain("Disallow: /api/");
    expect(txt).toMatch(/Sitemap: .*\/sitemap\.xml/);
  });
});
