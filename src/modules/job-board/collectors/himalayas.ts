import { fetchJson, HTTP_TIMEOUTS } from "@/lib/http/fetch-text";
import { expandWithParentCountries, resolveLocations } from "@/modules/job-board/locations";
import { placeFitsPrefs, roleMatchesAny } from "@/modules/job-board/match";
import type { JobSearchPrefs, RawJobHit } from "@/modules/job-board/types";
import { wantsRemote } from "@/modules/job-board/work-modes";

type HimalayasJob = {
  title?: string;
  excerpt?: string;
  description?: string;
  companyName?: string;
  guid?: string;
  applicationLink?: string;
  employmentType?: string;
  pubDate?: number | string;
  locationRestrictions?: string[];
  categories?: string[];
  parentCategories?: string[];
  seniority?: string[];
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
};

type HimalayasResponse = {
  jobs?: HimalayasJob[];
};

const SOFTWARE_RE =
  /\b(engineer|developer|software|frontend|backend|full[- ]?stack|devops|sre|data|mobile|ios|android|machine learning|\bml\b|typescript|react|python|programming|cyber|cloud|qa|test)\b/i;

const US_ONLY_RE = /\b(united states|\busa\b|\bus only\b|canada)\b/i;

export function himalayasIsSoftware(job: Pick<HimalayasJob, "title" | "categories" | "parentCategories">): boolean {
  const blob = `${job.title ?? ""} ${(job.categories ?? []).join(" ")} ${(job.parentCategories ?? []).join(" ")}`;
  return SOFTWARE_RE.test(blob);
}

export function himalayasIsEuropeFriendly(
  job: Pick<HimalayasJob, "locationRestrictions" | "title" | "excerpt">,
): boolean {
  const places = job.locationRestrictions ?? [];
  if (places.length === 0) return true;
  const hay = places.join(" ");
  if (places.every((place) => US_ONLY_RE.test(place)) && places.length <= 2) return false;
  if (/\b(europe|emea|france|germany|netherlands|spain|portugal|italy|belgium|switzerland|uk|united kingdom|ireland|morocco|maroc)\b/i.test(hay)) {
    return true;
  }
  if (/\b(worldwide|anywhere|remote)\b/i.test(hay)) return true;
  return !places.every((place) => US_ONLY_RE.test(place));
}

function salaryHint(job: HimalayasJob): string | undefined {
  if (!job.minSalary && !job.maxSalary) return undefined;
  const currency = job.currency || "USD";
  if (job.minSalary && job.maxSalary) return `${job.minSalary}–${job.maxSalary} ${currency}`;
  return `${job.minSalary || job.maxSalary} ${currency}`;
}

function toHit(job: HimalayasJob): RawJobHit | null {
  const title = job.title?.trim();
  const company = job.companyName?.trim();
  const url = (job.applicationLink || job.guid || "").trim();
  if (!title || !company || !url.startsWith("http")) return null;
  const places = job.locationRestrictions ?? [];
  const published =
    typeof job.pubDate === "number"
      ? new Date(job.pubDate > 10_000_000_000 ? job.pubDate : job.pubDate * 1000).toISOString()
      : job.pubDate
        ? new Date(job.pubDate).toISOString()
        : null;
  return {
    source: "himalayas",
    externalId: url,
    company,
    title,
    description: (job.description || job.excerpt || "").replace(/<[^>]+>/g, " ").trim(),
    url,
    location: places.length > 0 ? places.join(", ") : "Remote",
    salaryHint: salaryHint(job),
    tags: [
      job.employmentType,
      ...(job.seniority ?? []),
      ...(job.categories ?? []).slice(0, 6),
    ].filter(Boolean) as string[],
    publishedAt: published && !Number.isNaN(Date.parse(published)) ? published : null,
    workMode: "remote",
  };
}

/** Remote software jobs, Europe/EMEA first — skip the US-only dump. */
export async function collectHimalayas(prefs: JobSearchPrefs): Promise<RawJobHit[]> {
  if (!wantsRemote(prefs)) return [];
  const data = await fetchJson<HimalayasResponse>(
    "https://himalayas.app/jobs/api?limit=80",
    { timeoutMs: HTTP_TIMEOUTS.slow },
  );
  const selected = expandWithParentCountries(resolveLocations(prefs.locations));
  const hits: RawJobHit[] = [];

  for (const job of data.jobs ?? []) {
    if (!himalayasIsSoftware(job) || !himalayasIsEuropeFriendly(job)) continue;
    const hit = toHit(job);
    if (!hit) continue;
    if (!placeFitsPrefs(selected, hit.location, hit.title, true)) continue;
    if (!roleMatchesAny(prefs, hit.title)) continue;
    hits.push(hit);
    if (hits.length >= 40) break;
  }

  return hits;
}
