import { defineConfig } from "@playwright/test";

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ||
  "https://hub-dev-git-cursor-nuxt-port-1245-solvencys-projects-d62e6b46.vercel.app";

const shareRaw = process.env.PLAYWRIGHT_VERCEL_SHARE || "_vercel_share=ibSzVh6BLEijyOnHKWoX0PQelhD1nzuG";
const vercelBypass =
  process.env.VERCEL_AUTOMATION_BYPASS_SECRET ||
  (shareRaw.includes("=") ? shareRaw.split("=").slice(1).join("=") : shareRaw);

const vercelHeaders =
  baseURL.includes("vercel.app") && vercelBypass
    ? {
        "x-vercel-protection-bypass": vercelBypass,
        "x-vercel-set-bypass-cookie": "true",
      }
    : undefined;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  timeout: 120_000,
  retries: 1,
  use: {
    baseURL,
    browserName: "chromium",
    viewport: { width: 390, height: 844 },
    trace: "retain-on-failure",
    extraHTTPHeaders: vercelHeaders,
  },
  outputDir: "/opt/cursor/artifacts/playwright-output",
});
