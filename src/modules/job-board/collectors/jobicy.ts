import { fetchJson, HTTP_TIMEOUTS } from "@/lib/http/fetch-text";
import { isCredibleRegion } from "@/modules/job-board/match";
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

/** Remote jobs tagged France / Europe — skip the worldwide dump. */
export async function collectJobicy(prefs: JobSearchPrefs): Promise<RawJobHit[]> {
  if (prefs.workMode === "onsite") return [];

  const geo = "france";
  const url = `https://jobicy.com/api/v2/remote-jobs?count=20&geo=${geo}`;
  const data = await fetchJson<JobicyResponse>(url, { timeoutMs: HTTP_TIMEOUTS.slow });
  const role = prefs.roleQuery.trim().toLowerCase();

  return (data.jobs ?? []).flatMap((job) => {
    if (!job.jobTitle || !job.companyName || !job.url) return [];
    const blob = `${job.jobTitle} ${job.jobExcerpt ?? ""} ${job.jobDescription ?? ""} ${job.jobGeo ?? ""}`;
    if (!isCredibleRegion(job.jobGeo, blob)) return [];
    if (role) {
      const tokens = role.split(/\s+/).filter((t) => t.length >= 3);
      if (tokens.length > 0 && !tokens.some((t) => blob.toLowerCase().includes(t))) {
        return [];
      }
    }
    return [
      {
        source: "jobicy",
        externalId: String(job.id ?? job.url),
        company: job.companyName.trim(),
        title: job.jobTitle.trim(),
        description: (job.jobDescription || job.jobExcerpt || "").trim(),
        url: job.url,
        location: job.jobGeo || "Remote · France",
        tags: [job.jobType, ...(job.jobIndustry ?? [])].filter(Boolean) as string[],
        publishedAt: job.pubDate || null,
        workMode: "remote" as const,
      },
    ];
  });
}
