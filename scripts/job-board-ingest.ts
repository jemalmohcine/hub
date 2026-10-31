/**
 * Maintenance only: purge stale listings and send follow-up reminders.
 * Offers are scraped when a user has a saved search config and opens Offres
 * (or clicks Chercher). There is no hourly/morning global job pool.
 *
 * Usage:
 *   npm run job-board:ingest
 */
import { runJobBoardIngest } from "../src/modules/job-board/ingest";

async function main() {
  console.log("[job-board] starting maintenance");
  const result = await runJobBoardIngest();
  console.log("[job-board] done", JSON.stringify(result));
}

main().catch((err) => {
  console.error("[job-board] failed", err);
  process.exit(1);
});
