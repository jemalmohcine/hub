/**
 * Daily AI intel scrape — meant to run in GitHub Actions (or locally),
 * not via Vercel Cron.
 *
 * Usage:
 *   npm run ai-intel:ingest
 *   npm run ai-intel:ingest -- --mode=i18n
 */
import { backfillAiIntelI18n } from "../src/modules/ai-intel/backfill-i18n";
import { runAiIntelIngest } from "../src/modules/ai-intel/ingest";

function parseMode(argv: string[]): "full" | "i18n" {
  const flag = argv.find((a) => a.startsWith("--mode="));
  if (flag === "--mode=i18n") return "i18n";
  const idx = argv.indexOf("--mode");
  if (idx >= 0 && argv[idx + 1] === "i18n") return "i18n";
  return "full";
}

async function main() {
  const mode = parseMode(process.argv.slice(2));
  console.log(`[ai-intel] starting mode=${mode}`);

  if (mode === "i18n") {
    const result = await backfillAiIntelI18n(150);
    console.log("[ai-intel] i18n done", JSON.stringify(result));
    return;
  }

  const result = await runAiIntelIngest();
  console.log("[ai-intel] ingest done", JSON.stringify({
    runId: result.runId,
    status: result.status,
    mergeStats: result.mergeStats,
    discovery: result.discovery,
  }));

  const i18n = await backfillAiIntelI18n(80).catch((err) => {
    console.warn("[ai-intel] i18n backfill skipped", err);
    return null;
  });
  if (i18n) console.log("[ai-intel] i18n done", JSON.stringify(i18n));
}

main().catch((err) => {
  console.error("[ai-intel] failed", err);
  process.exit(1);
});
