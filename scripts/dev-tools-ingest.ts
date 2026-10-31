/**
 * Daily dev tools catalogue refresh — runs in GitHub Actions, not Vercel Cron.
 *
 * Usage:
 *   npm run dev-tools:ingest
 */
import { runDevToolsIngest } from "../src/modules/dev-tools/ingest";

async function main() {
  console.log("[dev-tools] starting");
  const result = await runDevToolsIngest();
  console.log("[dev-tools] done", JSON.stringify(result));
}

main().catch((err) => {
  console.error("[dev-tools] failed", err);
  process.exit(1);
});
