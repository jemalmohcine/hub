import { expect, test } from "@playwright/test";

const share =
  process.env.PLAYWRIGHT_VERCEL_SHARE ||
  "_vercel_share=ub1wlHXaGpmrfg8TLJhP71K8wFYVVAAh";

test.describe("hub mobile shell (preview)", () => {
  test("service worker v7 is deployed", async ({ request, baseURL }) => {
    const res = await request.get(`${baseURL}/sw.js?${share}`);
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain("hub-shell-v7");
    expect(body).toContain('url.pathname.startsWith("/app/")');
  });

  test("auth login page mobile screenshot", async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/auth/login?${share}`);
    await expect(page.locator('[data-testid="mobile-bottom-nav"]')).toHaveCount(0);
    await page.screenshot({
      path: "/opt/cursor/artifacts/screenshots/e2e-auth-login-mobile.png",
      fullPage: true,
    });
  });
});
