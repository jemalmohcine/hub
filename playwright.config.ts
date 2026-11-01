import { defineConfig, devices } from "@playwright/test";

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ||
  "https://hub-dev-git-cursor-nuxt-port-1245-solvencys-projects-d62e6b46.vercel.app";

export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  retries: 1,
  use: {
    baseURL,
    browserName: "chromium",
    viewport: { width: 390, height: 844 },
    trace: "retain-on-failure",
  },
  outputDir: "/opt/cursor/artifacts/playwright-output",
});
