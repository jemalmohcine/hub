import { expect, test } from "@playwright/test";

test.describe("hub mobile shell (local fixture)", () => {
  test.skip(() => process.env.PLAYWRIGHT_LOCAL !== "1", "Set PLAYWRIGHT_LOCAL=1");

  test("bottom nav, fab, padding, quick-add sheet", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/app/playwright-fixture`);
    await expect(page.locator('[data-testid="mobile-bottom-nav"]')).toBeVisible();
    await expect(page.locator('[data-testid="snippet-fab"]')).toBeVisible();
    await expect(page.locator('[data-testid="app-main"]')).toBeVisible();

    const mainBox = await page.locator('[data-testid="app-main"]').boundingBox();
    expect(mainBox?.x ?? 0).toBeGreaterThan(8);

    await page.locator('[data-testid="snippet-fab"]').click();
    await expect(page.locator('[data-testid="snippet-quick-add-sheet"]')).toBeVisible();

    await page.goto(`${baseURL}/app/outils/json`);
    await expect(page.locator('[data-testid="app-back-button"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: "JSON" })).toBeVisible();

    await page.screenshot({
      path: "/opt/cursor/artifacts/screenshots/e2e-shell-fixture-overview.png",
      fullPage: true,
    });
    await page.screenshot({
      path: "/opt/cursor/artifacts/screenshots/e2e-shell-outils-json.png",
      fullPage: true,
    });
  });
});
