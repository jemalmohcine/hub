import { collectRemoteOk } from "@/modules/job-board/collectors/remoteok";
import { collectRemotive } from "@/modules/job-board/collectors/remotive";
import type { RawJobHit } from "@/modules/job-board/types";

export async function collectAllJobSources(): Promise<RawJobHit[]> {
  const batches = await Promise.allSettled([
    collectRemoteOk(),
    collectRemotive(),
  ]);

  const hits: RawJobHit[] = [];
  for (const batch of batches) {
    if (batch.status === "fulfilled") hits.push(...batch.value);
  }
  return hits;
}
