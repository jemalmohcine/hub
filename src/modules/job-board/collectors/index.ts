import { collectArbeitnow } from "@/modules/job-board/collectors/arbeitnow";
import { collectIndeedFr } from "@/modules/job-board/collectors/indeed-fr";
import { collectJobicy } from "@/modules/job-board/collectors/jobicy";
import { collectRemotive } from "@/modules/job-board/collectors/remotive";
import {
  expandWithParentCountries,
  resolveLocations,
} from "@/modules/job-board/locations";
import { placeFitsPrefs, roleMatchesAny } from "@/modules/job-board/match";
import type { JobSearchPrefs, RawJobHit } from "@/modules/job-board/types";
import { EMPTY_JOB_SEARCH_PREFS } from "@/modules/job-board/types";
import { wantsRemote } from "@/modules/job-board/work-modes";

export const DEFAULT_FRANCE_SEARCH: JobSearchPrefs = {
  ...EMPTY_JOB_SEARCH_PREFS,
  roles: ["fullstack"],
  roleQuery: "Développeur full stack",
  locations: ["france"],
  workModes: ["hybrid"],
  workMode: "hybrid",
};

async function collectRemotiveForPrefs(prefs: JobSearchPrefs): Promise<RawJobHit[]> {
  if (!wantsRemote(prefs)) return [];
  const hits = await collectRemotive();
  const selected = expandWithParentCountries(resolveLocations(prefs.locations));
  return hits.filter((hit) => {
    if (!placeFitsPrefs(selected, hit.location, hit.title, true)) return false;
    return roleMatchesAny(prefs, hit.title);
  });
}

export async function collectJobsForPrefs(prefs: JobSearchPrefs): Promise<RawJobHit[]> {
  const batches = await Promise.allSettled([
    collectIndeedFr(prefs),
    collectJobicy(prefs),
    collectArbeitnow(prefs),
    collectRemotiveForPrefs(prefs),
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
