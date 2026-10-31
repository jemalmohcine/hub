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
