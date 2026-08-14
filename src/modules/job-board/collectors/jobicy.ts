import { fetchJson, HTTP_TIMEOUTS } from "@/lib/http/fetch-text";
import {
  expandWithParentCountries,
  resolveLocations,
} from "@/modules/job-board/locations";
import { isCredibleRegion, roleMatchesAny } from "@/modules/job-board/match";
import type { JobSearchPrefs, RawJobHit } from "@/modules/job-board/types";

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

function jobicyGeos(prefs: JobSearchPrefs): string[] {
  const selected = expandWithParentCountries(resolveLocations(prefs.locations));
  const geos = selected
    .map((entry) => entry.jobicyGeo)
    .filter((geo): geo is string => Boolean(geo));
  if (geos.length === 0) return ["france"];
  return [...new Set(geos)].slice(0, 4);
}

async function collectJobicyGeo(geo: string, prefs: JobSearchPrefs): Promise<RawJobHit[]> {
  const tag = prefs.roleQuery.trim().split(/\s+/)[0] ?? "";
  const params = new URLSearchParams({ count: "20", geo });
  if (tag.length >= 3) params.set("tag", tag.toLowerCase());
  const url = `https://jobicy.com/api/v2/remote-jobs?${params.toString()}`;
  const data = await fetchJson<JobicyResponse>(url, { timeoutMs: HTTP_TIMEOUTS.slow });
  const selected = expandWithParentCountries(resolveLocations(prefs.locations));

  return (data.jobs ?? []).flatMap((job) => {
    if (!job.jobTitle || !job.companyName || !job.url) return [];
    const blob = `${job.jobTitle} ${job.jobExcerpt ?? ""} ${job.jobDescription ?? ""} ${job.jobGeo ?? ""}`;
    if (!isCredibleRegion(job.jobGeo, blob, selected)) return [];
    if (!roleMatchesAny(prefs, blob)) return [];
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
  if (prefs.workMode === "onsite") return [];
  const batches = await Promise.allSettled(
    jobicyGeos(prefs).map((geo) => collectJobicyGeo(geo, prefs)),
  );
  return batches.flatMap((batch) => (batch.status === "fulfilled" ? batch.value : []));
}
