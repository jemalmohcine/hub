import { createClient } from "@supabase/supabase-js";
import { chromium, expect, type FullConfig } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const AUTH_FILE = path.join("e2e", ".auth", "user.json");
const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL || "e2ehubplaywright1245@gmail.com";
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD || "E2eHubPlaywright!2026";

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL as string;
  const share =
    process.env.PLAYWRIGHT_VERCEL_SHARE ||
    (baseURL.includes("vercel.app") ? "_vercel_share=ub1wlHXaGpmrfg8TLJhP71K8wFYVVAAh" : "");
  const shareQuery =
    share && baseURL.includes("vercel.app")
      ? share.startsWith("?")
        ? share
        : `?${share}`
      : "";

  const supabaseUrl = process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey) {
    console.warn("[e2e] Missing Supabase URL/anon key — skipping authenticated setup");
    return;
  }

  const anon = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (serviceKey) {
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: existing } = await admin.auth.admin.listUsers({ perPage: 200 });
    const found = existing.users.find((u) => u.email === TEST_EMAIL);
    if (!found) {
      const { error } = await admin.auth.admin.createUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true,
      });
      if (error) console.warn("[e2e] createUser:", error.message);
    }
  } else {
    const { error: signInErr } = await anon.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    if (signInErr) {
      const { error: signUpErr } = await anon.auth.signUp({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });
      if (signUpErr) console.warn("[e2e] signUp:", signUpErr.message);
    }
  }

  const vercelBypass =
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET ||
    (share.includes("=") ? share.split("=").slice(1).join("=") : share);
  const extraHTTPHeaders =
    baseURL.includes("vercel.app") && vercelBypass
      ? {
          "x-vercel-protection-bypass": vercelBypass,
          "x-vercel-set-bypass-cookie": "true",
        }
      : undefined;

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    extraHTTPHeaders,
  });
  const page = await context.newPage();

  await page.goto(`${baseURL}/auth/login${shareQuery}`, { waitUntil: "domcontentloaded" });
  await page.locator("h1", { hasText: "Connexion" }).waitFor({ timeout: 30_000 });
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  await emailInput.click();
  await emailInput.pressSequentially(TEST_EMAIL, { delay: 15 });
  await passwordInput.click();
  await passwordInput.pressSequentially(TEST_PASSWORD, { delay: 15 });
  await passwordInput.blur();
  const loginBtn = page.getByRole("button", { name: "Se connecter" });
  await loginBtn.waitFor({ state: "visible", timeout: 15_000 });
  await expect(loginBtn).toBeEnabled({ timeout: 15_000 });
  await loginBtn.click();
  await page.waitForURL(/\/app\//, { timeout: 60_000 });
  const nav = page.locator('[data-testid="mobile-bottom-nav"]');
  try {
    await nav.waitFor({ timeout: 30_000 });
  } catch {
    await page.screenshot({ path: "/opt/cursor/artifacts/screenshots/e2e-setup-after-login.png", fullPage: true });
    throw new Error(`No app shell after login; url=${page.url()}`);
  }

  await page.goto(`${baseURL}/app/snippets${shareQuery}`, { waitUntil: "networkidle" });
  await page.locator('[data-testid="mobile-bottom-nav"]').waitFor({ timeout: 30_000 });
  const snippetCount = await page.locator('[data-testid="snippet-list"] li').count();
  if (snippetCount === 0) {
    await page.locator('[data-testid="snippet-fab"]').click();
    await page.locator('[data-testid="snippet-quick-add-sheet"]').waitFor();
    await page.getByPlaceholder("Titre").fill("E2E Playwright seed");
    await page.getByPlaceholder("Colle ton code ici…").fill('console.log("e2e");');
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await page.locator('[data-testid="snippet-list"] li').first().waitFor({ timeout: 15_000 });
  }

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  await context.storageState({ path: AUTH_FILE });
  await browser.close();
}
