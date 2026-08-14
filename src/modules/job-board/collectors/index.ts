import { collectArbeitnow } from "@/modules/job-board/collectors/arbeitnow";
import { collectIndeedFr } from "@/modules/job-board/collectors/indeed-fr";
import { collectJobicy } from "@/modules/job-board/collectors/jobicy";
import { collectRemotive } from "@/modules/job-board/collectors/remotive";
import { isCredibleRegion } from "@/modules/job-board/match";
import type { JobSearchPrefs, RawJobHit } from "@/modules/job-board/types";
import { EMPTY_JOB_SEARCH_PREFS } from "@/modules/job-board/types";

export const DEFAULT_FRANCE_SEARCH: JobSearchPrefs = {
  ...EMPTY_JOB_SEARCH_PREFS,
  roleQuery: "développeur",
  city: "France",
  workMode: "hybrid",
};

async function collectRemotiveFrance(prefs: JobSearchPrefs): Promise<RawJobHit[]> {
  if (prefs.workMode === "onsite") return [];
  const hits = await collectRemotive();
  const role = prefs.roleQuery.trim().toLowerCase();
  return hits.filter((hit) => {
    const blob = `${hit.title} ${hit.description} ${hit.location ?? ""}`;
    if (!isCredibleRegion(hit.location, blob)) return false;
    if (!role) return true;
    const tokens = role.split(/\s+/).filter((t) => t.length >= 3);
    if (tokens.length === 0) return true;
    return tokens.some((token) => blob.toLowerCase().includes(token));
  });
}

export async function collectJobsForPrefs(prefs: JobSearchPrefs): Promise<RawJobHit[]> {
  const batches = await Promise.allSettled([
    collectIndeedFr(prefs),
    collectJobicy(prefs),
    collectArbeitnow(prefs),
    collectRemotiveFrance(prefs),
  ]);

  const hits: RawJobHit[] = [];
  const seen = new Set<string>();
  for (const batch of batches) {
    if (batch.status !== "fulfilled") continue;
    for (const hit of batch.value) {
      const key = hit.url.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      hits.push(hit);
    }
  }
  return hits;
}

export async function collectAllJobSources(): Promise<RawJobHit[]> {
  return collectJobsForPrefs(DEFAULT_FRANCE_SEARCH);
}
