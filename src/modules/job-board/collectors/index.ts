import { collectArbeitnow } from "@/modules/job-board/collectors/arbeitnow";
import { collectIndeedFr } from "@/modules/job-board/collectors/indeed-fr";
import { collectJobicy } from "@/modules/job-board/collectors/jobicy";
import { collectRemotive } from "@/modules/job-board/collectors/remotive";
import { collectWwr } from "@/modules/job-board/collectors/wwr";
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

async function settled(label: string, task: Promise<RawJobHit[]>): Promise<RawJobHit[]> {
  try {
    const hits = await task;
    console.info(`[jobs] ${label}`, hits.length);
    return hits;
  } catch (err) {
    console.warn(`[jobs] ${label} failed`, err instanceof Error ? err.message : err);
    return [];
  }
}

/**
 * Live sources that still answer. Indeed RSS is 403 most of the time —
 * we try it with a short timeout so it cannot block Jobicy / Remotive.
 */
export async function collectJobsForPrefs(prefs: JobSearchPrefs): Promise<RawJobHit[]> {
  const batches = await Promise.all([
    settled("jobicy", collectJobicy(prefs)),
    settled("remotive", collectRemotiveForPrefs(prefs)),
    settled("wwr", collectWwr(prefs)),
    settled("arbeitnow", collectArbeitnow(prefs)),
    settled("indeed", collectIndeedFr(prefs)),
  ]);

  const hits: RawJobHit[] = [];
  const seen = new Set<string>();
  for (const batch of batches) {
    for (const hit of batch) {
      const key = hit.url.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      hits.push(hit);
    }
  }
  console.info("[jobs] collected", hits.length);
  return hits;
}

export async function collectAllJobSources(): Promise<RawJobHit[]> {
  return collectJobsForPrefs(DEFAULT_FRANCE_SEARCH);
}
