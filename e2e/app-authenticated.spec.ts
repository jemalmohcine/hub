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

  test("overview shell: nav, FAB, main padding", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/app/overview${shareQ}`);
    await expect(page.locator('[data-testid="mobile-bottom-nav"]')).toBeVisible();
    await expect(page.locator('[data-testid="snippet-fab"]')).toBeVisible();
    const padLeft = await page.locator('[data-testid="app-main"]').evaluate((el) =>
      parseFloat(getComputedStyle(el).paddingLeft),
    );
    expect(padLeft).toBeGreaterThan(8);
  });

  test("snippets hard load: no 500, list or empty state", async ({ page, baseURL }) => {
    const response = await page.goto(`${baseURL}/app/snippets${shareQ}`, {
      waitUntil: "networkidle",
    });
    expect(response?.status()).not.toBe(500);
    await expect(page.getByText("500")).toHaveCount(0);
    await expect(page.locator('[data-testid="mobile-bottom-nav"]')).toBeVisible();
    await page.waitForTimeout(2000);
    const hasList = (await page.locator('[data-testid="snippet-list"] li').count()) > 0;
    const hasEmpty =
      (await page.getByText("Aucun snippet").count()) > 0 ||
      (await page.getByText("Bibliothèque").count()) > 0;
    expect(hasList || hasEmpty).toBeTruthy();
    await page.screenshot({
      path: "/opt/cursor/artifacts/screenshots/e2e-auth-snippets-mobile.png",
      fullPage: true,
    });
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

  test("outils/json: title, back, padding", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/app/outils/json${shareQ}`);
    await expect(page.locator('[data-testid="app-back-button"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: "JSON" })).toBeVisible();
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
  test("sw.js is hub-shell-v7", async ({ request, baseURL }) => {
    const res = await request.get(`${baseURL}/sw.js${shareQ}`);
    expect(await res.text()).toContain("hub-shell-v7");
  });
});
