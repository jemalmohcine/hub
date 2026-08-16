import { fetchJson, HTTP_TIMEOUTS } from "@/lib/http/fetch-text";
import {
  expandWithParentCountries,
  resolveLocations,
} from "@/modules/job-board/locations";
import { isCredibleRegion, roleMatchesAny } from "@/modules/job-board/match";
import type { JobSearchPrefs, RawJobHit } from "@/modules/job-board/types";

type ArbeitnowJob = {
  slug?: string;
  company_name?: string;
  title?: string;
  description?: string;
  url?: string;
  location?: string;
  remote?: boolean;
  created_at?: number | string;
  tags?: string[];
  job_types?: string[];
};

type ArbeitnowResponse = {
  data?: ArbeitnowJob[];
};

/** European job board (no key). Filtered to the selected cities / countries. */
export async function collectArbeitnow(prefs: JobSearchPrefs): Promise<RawJobHit[]> {
  const data = await fetchJson<ArbeitnowResponse>(
    "https://www.arbeitnow.com/api/job-board-api",
    { timeoutMs: HTTP_TIMEOUTS.slow },
  );

  const selected = expandWithParentCountries(resolveLocations(prefs.locations));
  const hits: RawJobHit[] = [];

  for (const job of data.data ?? []) {
    if (!job.title || !job.company_name || !job.url) continue;
    const blob = `${job.title} ${job.description ?? ""} ${job.location ?? ""} ${(job.tags ?? []).join(" ")}`;
    if (!isCredibleRegion(job.location, blob, selected)) continue;
    if (!roleMatchesAny(prefs, `${job.title} ${(job.tags ?? []).join(" ")}`)) continue;

    hits.push({
      source: "arbeitnow",
      externalId: job.slug || job.url,
      company: job.company_name.trim(),
      title: job.title.trim(),
      description: (job.description ?? "").trim(),
      url: job.url,
      location: job.location || (job.remote ? "Remote · Europe" : null) || undefined,
      tags: [...(job.tags ?? []), ...(job.job_types ?? [])],
      publishedAt:
        typeof job.created_at === "number"
          ? new Date(
              job.created_at > 10_000_000_000 ? job.created_at : job.created_at * 1000,
            ).toISOString()
          : job.created_at || null,
      workMode: job.remote ? "remote" : undefined,
    });
  }

  return hits.slice(0, 40);
}
