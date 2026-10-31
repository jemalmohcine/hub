import { fetchJson, HTTP_TIMEOUTS } from "@/lib/http/fetch-text";
import {
  expandWithParentCountries,
  isEuropeanPlace,
  resolveLocations,
} from "@/modules/job-board/locations";
import { placeFitsPrefs, roleMatchesAny } from "@/modules/job-board/match";
import { resolveRoles } from "@/modules/job-board/roles";
import type { JobSearchPrefs, RawJobHit } from "@/modules/job-board/types";
import { wantsRemote } from "@/modules/job-board/work-modes";

type JobicyJob = {
  id?: number | string;
  url?: string;
  jobTitle?: string;
  companyName?: string;
  jobExcerpt?: string;
  jobDescription?: string;
  jobGeo?: string;
  jobType?: string;
  jobIndustry?: string[];
  pubDate?: string;
};

type JobicyResponse = {
  jobs?: JobicyJob[];
};

function jobicyTag(prefs: JobSearchPrefs): string {
  const role = resolveRoles(
    prefs.roles.length > 0 ? prefs.roles : prefs.roleQuery ? [prefs.roleQuery] : [],
  )[0];
  if (!role) return "";
  const compact = [...role.aliases, role.id]
    .map((value) => value.replace(/-/g, " ").trim())
    .find((value) => value.length >= 3 && !value.includes(" "));
  return compact ?? "";
}

const JOBICY_GEO_REWRITE: Record<string, string> = {
  morocco: "emea",
  algeria: "emea",
  tunisia: "emea",
  egypt: "emea",
};

function jobicyGeos(prefs: JobSearchPrefs): string[] {
  const selected = expandWithParentCountries(resolveLocations(prefs.locations));
  const geos = new Set<string>();
  for (const entry of selected) {
    if (isEuropeanPlace(entry)) geos.add("europe");
    const raw = entry.jobicyGeo ? JOBICY_GEO_REWRITE[entry.jobicyGeo] ?? entry.jobicyGeo : null;
    if (raw) geos.add(raw);
  }
  if (geos.size === 0) geos.add("europe");
  return [...geos].slice(0, 4);
}

async function collectJobicyGeo(geo: string, prefs: JobSearchPrefs): Promise<RawJobHit[]> {
  const tag = jobicyTag(prefs);
  const params = new URLSearchParams({ count: "20", geo });
  if (tag.length >= 3) params.set("tag", tag.toLowerCase());
  const url = `https://jobicy.com/api/v2/remote-jobs?${params.toString()}`;
  const data = await fetchJson<JobicyResponse>(url, { timeoutMs: HTTP_TIMEOUTS.slow });
  const selected = expandWithParentCountries(resolveLocations(prefs.locations));

  return (data.jobs ?? []).flatMap((job) => {
    if (!job.jobTitle || !job.companyName || !job.url) return [];
    if (!placeFitsPrefs(selected, job.jobGeo, job.jobTitle, true)) return [];
    if (!roleMatchesAny(prefs, job.jobTitle)) return [];
    return [
      {
        source: "jobicy",
        externalId: String(job.id ?? job.url),
        company: job.companyName.trim(),
        title: job.jobTitle.trim(),
        description: (job.jobDescription || job.jobExcerpt || "").trim(),
        url: job.url,
        location: job.jobGeo || `Remote · ${geo}`,
        tags: [job.jobType, ...(job.jobIndustry ?? [])].filter(Boolean) as string[],
        publishedAt: job.pubDate || null,
        workMode: "remote" as const,
      },
    ];
  });
}

/** Remote jobs for the selected countries — skip the worldwide dump. */
export async function collectJobicy(prefs: JobSearchPrefs): Promise<RawJobHit[]> {
  if (!wantsRemote(prefs)) return [];
  const batches = await Promise.allSettled(
    jobicyGeos(prefs).map((geo) => collectJobicyGeo(geo, prefs)),
  );
  return batches.flatMap((batch) => (batch.status === "fulfilled" ? batch.value : []));
}
