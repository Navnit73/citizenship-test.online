import { expect, test } from "@playwright/test";
import { loginAs, unique } from "./auth-helpers";
import { expectNoA11yViolations } from "./helpers";

test.describe("access control", () => {
  test("anonymous visitors are sent to the login page", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });

  test("anonymous API calls get 401", async ({ request }) => {
    expect((await request.get("/api/admin/posts")).status()).toBe(401);
  });

  test("plain users see 'Access denied' and get 403 from the API", async ({ page }) => {
    await loginAs(page, "user", "/admin");
    await expect(page.getByRole("heading", { name: /access denied/i })).toBeVisible();
    expect((await page.request.get("/api/admin/posts")).status()).toBe(403);
    expect((await page.request.get("/api/admin/users")).status()).toBe(403);
  });

  test("editors cannot reach admin-only areas", async ({ page }) => {
    await loginAs(page, "editor", "/admin");
    await expect(page.getByRole("link", { name: "Users" })).toHaveCount(0);
    expect((await page.request.get("/api/admin/users")).status()).toBe(403);
    expect((await page.request.get("/api/admin/audit")).status()).toBe(403);
  });

  test("cross-origin mutations are blocked", async ({ page }) => {
    await loginAs(page, "editor");
    const res = await page.request.post("/api/admin/redirects", {
      headers: { origin: "https://evil.example" },
      data: { from: "/csrf", to: "/x" },
    });
    expect(res.status()).toBe(403);
  });

  test("login page has no accessibility violations", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expectNoA11yViolations(page);
  });
});

test.describe("authors", () => {
  test.skip(({ isMobile }) => isMobile, "CMS journeys run on desktop");

  test("can draft but not publish", async ({ page }) => {
    await loginAs(page, "author", "/admin/posts/new");
    await expect(page.getByRole("heading", { name: "New post" })).toBeVisible();
    await expect(page.getByLabel(/^Status/).locator("option")).toHaveText(["Draft"]);
    await page.getByLabel(/^Title/).fill(unique("Author draft"));
    await page.getByRole("textbox", { name: "Body" }).click();
    await page.keyboard.type("Draft body");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page).toHaveURL(/\/admin\/posts\/[a-f0-9]{24}/);
    await expect(page.getByRole("link", { name: "Questions" })).toHaveCount(0);
  });
});

test.describe("editor journeys", () => {
  test.skip(({ isMobile }) => isMobile, "CMS journeys run on desktop");

  test("publishes a guide that appears in the listing, its own page and the sitemap", async ({
    page,
    request,
  }) => {
    const title = unique("E2E Guide");
    await loginAs(page, "editor", "/admin/posts/new");
    await expectNoA11yViolations(page);

    await page.getByLabel(/^Type/).selectOption("guide");
    await page.getByLabel(/^Title/).fill(title);
    await page.getByRole("textbox", { name: "Body" }).click();
    await page.getByRole("button", { name: "H2" }).click();
    // The toolbar hands focus back to the editor asynchronously.
    await expect(page.getByRole("textbox", { name: "Body" })).toBeFocused();
    await page.keyboard.type("Getting started");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Hello from the editor <script>alert(1)</script>");
    await page.getByLabel(/^Status/).selectOption("published");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page).toHaveURL(/\/admin\/posts\/[a-f0-9]{24}/);

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await page.goto("/guides");
    await expect(page.getByRole("link", { name: title })).toBeVisible();

    await page.goto(`/guides/${slug}`);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Getting started" })).toBeVisible();
    await expect(page.locator("article script")).toHaveCount(0);
    await expectNoA11yViolations(page);

    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain(`/guides/${slug}`);
  });

  test("a scheduled post stays hidden until its date", async ({ page }) => {
    const title = unique("Scheduled");
    await loginAs(page, "editor", "/admin/posts/new");
    await page.getByLabel(/^Title/).fill(title);
    await page.getByRole("textbox", { name: "Body" }).click();
    await page.keyboard.type("Later");
    await page.getByLabel(/^Status/).selectOption("scheduled");
    await page.getByLabel("Publish date").fill("2099-01-01T10:00");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page).toHaveURL(/\/admin\/posts\/[a-f0-9]{24}/);

    await page.goto(`/blog/${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`);
    await expect(page.getByText(/could not be found|not found/i).first()).toBeVisible();
    await page.goto("/blog");
    await expect(page.getByRole("link", { name: title })).toHaveCount(0);
  });

  test("a duplicate slug shows a clear error", async ({ page }) => {
    const title = unique("Dupe");
    await loginAs(page, "editor", "/admin/posts/new");
    const fill = async () => {
      await page.getByLabel(/^Title/).fill(title);
      await page.getByRole("textbox", { name: "Body" }).click();
      await page.keyboard.type("x");
      await page.getByRole("button", { name: "Save" }).click();
    };
    await fill();
    await expect(page).toHaveURL(/\/admin\/posts\/[a-f0-9]{24}/);
    await page.goto("/admin/posts/new");
    await fill();
    await expect(page.getByRole("alert").filter({ hasText: /already exists/i })).toBeVisible();
  });

  test("builds and publishes a custom test that a guest can take", async ({ page }) => {
    const title = unique("Custom Test");
    await loginAs(page, "editor", "/admin/tests/new");
    await page.getByLabel(/^Title/).fill(title);
    await page.getByLabel(/^Country/).selectOption("uk");
    await page.getByLabel(/^Kind/).selectOption("custom");
    const first = page
      .getByRole("group", { name: /questions/i })
      .getByRole("checkbox")
      .first();
    await first.check();
    await page.getByLabel("Published", { exact: true }).check();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page).toHaveURL(/\/admin\/tests\/[a-f0-9]{24}/);

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await page.goto("/tests");
    await expect(page.getByRole("link", { name: title })).toBeVisible();
    await page.goto(`/tests/${slug}`);
    await page.getByRole("button", { name: /start test/i }).click();
    await page.getByRole("radio").or(page.getByRole("checkbox")).first().check();
    await page.getByRole("button", { name: /submit answer/i }).click();
    await expect(page.getByRole("heading", { name: /you passed|you did not pass/i })).toBeVisible();
  });

  test("bulk import: dry run reports errors without writing, then imports", async ({ page }) => {
    const prompt = unique("Import Q");
    await loginAs(page, "editor", "/admin/questions/import");
    await expectNoA11yViolations(page);
    const header =
      "countryCode,versions,chapter,type,prompt,options,correct,accepted,explanation,sourceRef,tags,difficulty,status";
    const csv = [
      header,
      `uk,3rd-edition,history,single,"${prompt}",a:Yes|b:No,a,,,Handbook,,1,draft`,
      `uk,3rd-edition,nope,single,"Bad chapter",a:Yes|b:No,a,,,Handbook,,1,draft`,
    ].join("\n");
    await page.getByLabel("Data").fill(csv);
    await page.getByRole("button", { name: "Dry run" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Dry run" })).toContainText("1 new");
    await expect(page.getByRole("status").filter({ hasText: "Dry run" })).toContainText(
      /Row 2: .*chapter/i,
    );
    await page.getByRole("button", { name: "Import", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Imported" })).toContainText("1 new");

    await page.goto("/admin/questions");
    await expect(page.getByRole("link", { name: prompt })).toBeVisible();
  });

  test("redirects created in the admin take effect on the public site", async ({ page }) => {
    const from = `/${unique("old")}`;
    await loginAs(page, "editor", "/admin/redirects");
    await expectNoA11yViolations(page);
    await page.getByLabel("From path").fill(from);
    await page.getByLabel("To (path or URL)").fill("/guides");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByRole("row", { name: new RegExp(from) })).toBeVisible();

    await page.goto(from);
    await expect(page).toHaveURL(/\/guides$/);
  });

  test("editing a post keeps a revision, and editors can delete", async ({ page }) => {
    const title = unique("Revisions");
    await loginAs(page, "editor", "/admin/posts/new");
    await page.getByLabel(/^Title/).fill(title);
    await page.getByRole("textbox", { name: "Body" }).click();
    await page.keyboard.type("Version one");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page).toHaveURL(/\/admin\/posts\/[a-f0-9]{24}/);
    await expect(page.getByText("0 previous revision(s)")).toBeVisible();

    await page.getByRole("textbox", { name: "Body" }).click();
    await page.keyboard.press("End");
    await page.keyboard.type(" and two");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("1 previous revision(s)")).toBeVisible();

    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page).toHaveURL(/\/admin\/posts$/);
    await expect(page.getByRole("link", { name: title })).toHaveCount(0);
  });

  test("admins manage roles and see the audit log", async ({ page }) => {
    await loginAs(page, "admin", "/admin/users");
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
    await expectNoA11yViolations(page);
    await page.getByRole("link", { name: "Audit log" }).click();
    await expect(page.getByRole("heading", { name: "Audit log" })).toBeVisible();
  });
});
