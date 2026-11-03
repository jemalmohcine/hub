import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const share =
  process.env.PLAYWRIGHT_VERCEL_SHARE ||
  "_vercel_share=ibSzVh6BLEijyOnHKWoX0PQelhD1nzuG";
const shareQ = share.startsWith("?") ? share : `?${share}`;

const authFile = path.join("e2e", ".auth", "user.json");
const hasAuth = fs.existsSync(authFile);

test.describe("deployed app (authenticated)", () => {
  test.skip(!hasAuth, "Run global-setup with Supabase env (see e2e/global-setup.ts)");

  test.use({ storageState: authFile });

  test("build marker and Nuxt deploy on overview", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/app/overview${shareQ}`);
    await expect(page.locator('[data-testid="mobile-bottom-nav"]')).toBeVisible({ timeout: 30_000 });
    const build =
      (await page.locator('[data-testid="build-sha"]').textContent()) ||
      (await page.locator('meta[name="dh-build"]').getAttribute("content"));
    expect(build && build.length >= 7).toBeTruthy();
    expect(build).not.toBe("dev");
    await page.screenshot({
      path: "/opt/cursor/artifacts/screenshots/e2e-auth-overview-mobile.png",
      fullPage: true,
    });
  });

  test("overview shell: mobile in-flow header and snippet add", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/app/overview${shareQ}`);
    await expect(page.locator('[data-testid="mobile-bottom-nav"]')).toBeVisible();
    await expect(page.locator('[data-testid="snippet-fab"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="snippet-add-header"]')).toBeVisible();
    const headerPosition = await page.locator('[data-testid="mobile-page-header"]').evaluate((el) => getComputedStyle(el).position);
    expect(headerPosition).toBe("static");
    const mobileTitle = page.locator(".mobile-page-header__title");
    await expect(mobileTitle).toHaveText("Accueil");
    await expect(page.locator(".dh-page-title")).toHaveCount(0);
    const padLeft = await page.locator('[data-testid="app-main"]').evaluate((el) =>
      parseFloat(getComputedStyle(el).paddingLeft),
    );
    expect(padLeft).toBeGreaterThan(8);
    const addStyles = await page.locator(".mobile-page-header__add").evaluate((el) => {
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        filter: cs.filter,
        boxShadow: cs.boxShadow,
        width: rect.width,
        height: rect.height,
      };
    });
    expect(addStyles.filter === "none" || !addStyles.filter).toBeTruthy();
    expect(addStyles.boxShadow === "none" || addStyles.boxShadow === "").toBeTruthy();
    expect(addStyles.width).toBeGreaterThanOrEqual(44);
    expect(addStyles.height).toBeGreaterThanOrEqual(44);
    const logoStyles = await page.locator(".mobile-page-header__logo-svg").evaluate((el) => {
      const cs = getComputedStyle(el);
      return { filter: cs.filter, boxShadow: cs.boxShadow };
    });
    expect(logoStyles.filter === "none" || !logoStyles.filter).toBeTruthy();
    expect(logoStyles.boxShadow === "none" || logoStyles.boxShadow === "").toBeTruthy();
    const shellBg = await page.locator(".app-shell").evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(shellBg === "none" || shellBg === "").toBeTruthy();
  });

  test("career hub: bottom nav Accueil returns to overview", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/app/career${shareQ}`);
    await page.locator('[data-testid="mobile-bottom-nav"] a[href*="/app/overview"]').click();
    await expect(page).toHaveURL(/\/app\/overview/);
  });

  test("snippets hard load: no 500, list or empty state", async ({ page, baseURL }) => {
    const response = await page.goto(`${baseURL}/app/snippets${shareQ}`, {
      waitUntil: "networkidle",
    });
    expect(response?.status()).not.toBe(500);
    await expect(page.getByText("500")).toHaveCount(0);
    await expect(page.locator('[data-testid="mobile-bottom-nav"]')).toBeVisible();
    await page.waitForTimeout(2000);
    const hasList = (await page.locator('[data-testid="snippet-list"] li').count()) >= 3;
    expect(hasList).toBeTruthy();
    await page.screenshot({
      path: "/opt/cursor/artifacts/screenshots/e2e-auth-snippets-mobile.png",
      fullPage: true,
    });
  });

  test("header + opens quick-add sheet (same as FAB)", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/app/ai${shareQ}`);
    await expect(page.locator('[data-testid="mobile-bottom-nav"]')).toBeVisible();
    const addBtn = page.locator('[data-testid="snippet-add-header"]');
    const box = await addBtn.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
    await addBtn.click();
    await expect(page.locator('[data-testid="snippet-quick-add-sheet"]')).toBeVisible();
    await page.screenshot({
      path: "/opt/cursor/artifacts/screenshots/e2e-header-snippet-add.png",
      fullPage: true,
    });
  });

  test("appearance: switch to dark theme applies html.dark", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/app/settings/appearance${shareQ}`);
    await expect(page.locator('[data-testid="mobile-bottom-nav"]')).toBeVisible();
    await page.locator('[data-testid="theme-option-dark"]').click();
    await expect
      .poll(async () => page.evaluate(() => document.documentElement.classList.contains("dark")))
      .toBe(true);
    await page.screenshot({
      path: "/opt/cursor/artifacts/screenshots/e2e-theme-dark-appearance.png",
      fullPage: true,
    });
  });

  test("appearance: dark theme persists after reload", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/app/settings/appearance${shareQ}`);
    await expect(page.locator('[data-testid="mobile-bottom-nav"]')).toBeVisible();
    await page.locator('[data-testid="theme-option-dark"]').click();
    await expect
      .poll(async () => page.evaluate(() => document.documentElement.classList.contains("dark")))
      .toBe(true);
    await expect
      .poll(async () =>
        page.evaluate(() => localStorage.getItem("hub-color-mode")),
      )
      .toBe("dark");
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect
      .poll(async () => page.evaluate(() => document.documentElement.classList.contains("dark")))
      .toBe(true);
    await expect
      .poll(async () =>
        page.evaluate(() => localStorage.getItem("hub-color-mode")),
      )
      .toBe("dark");
  });

  test("FAB opens quick-add sheet", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/app/snippets${shareQ}`);
    await page.locator('[data-testid="snippet-fab"]').click();
    await expect(page.locator('[data-testid="snippet-quick-add-sheet"]')).toBeVisible();
    await page.screenshot({
      path: "/opt/cursor/artifacts/screenshots/e2e-auth-snippet-sheet.png",
      fullPage: true,
    });
  });

  test("outils/json: title, back link, padding", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/app/outils/json${shareQ}`);
    await expect(page.getByRole("link", { name: /Outils/i })).toBeVisible();
    await expect(page.locator(".mobile-page-header__title")).toHaveText("JSON");
    const padLeft = await page.locator('[data-testid="app-main"]').evaluate((el) =>
      parseFloat(getComputedStyle(el).paddingLeft),
    );
    expect(padLeft).toBeGreaterThan(8);
    await page.screenshot({
      path: "/opt/cursor/artifacts/screenshots/e2e-auth-outils-json.png",
      fullPage: true,
    });
  });
});

test.describe("deployed build metadata", () => {
  test("sw.js is hub-shell-v13", async ({ request, baseURL }) => {
    const res = await request.get(`${baseURL}/sw.js${shareQ}`);
    expect(await res.text()).toContain("hub-shell-v13");
  });
});
