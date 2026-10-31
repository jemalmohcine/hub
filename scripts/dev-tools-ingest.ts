import { runDevToolsIngest } from "../server/utils/dev-tools/ingest";

async function main() {
  console.log("[dev-tools] starting");
  const result = await runDevToolsIngest();
  console.log("[dev-tools] done", JSON.stringify(result));
}

main().catch((err) => {
  console.error("[dev-tools] failed", err);
  process.exit(1);
});
