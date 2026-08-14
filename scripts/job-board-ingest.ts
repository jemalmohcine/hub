/**
 * Scrape France-first job sources into Supabase (job_listings),
 * using saved user search prefs when they exist. Also triggered on save.
 *
 * Usage:
 *   npm run job-board:ingest
 */
import { runJobBoardIngest } from "../src/modules/job-board/ingest";

async function main() {
  console.log("[job-board] starting ingest");
  const result = await runJobBoardIngest();
  console.log("[job-board] done", JSON.stringify(result));
}

main().catch((err) => {
  console.error("[job-board] failed", err);
  process.exit(1);
});
