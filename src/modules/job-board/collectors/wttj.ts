import { postJson, HTTP_TIMEOUTS } from "@/lib/http/fetch-text";
import { formatNumber } from "@/lib/numbers";
import {
  expandWithParentCountries,
  resolveLocations,
} from "@/modules/job-board/locations";
import { placeFitsPrefs, roleMatchesAny } from "@/modules/job-board/match";
import { collectorSearchQueries } from "@/modules/job-board/scrape-query";
import type { JobSearchPrefs, JobWorkMode, RawJobHit } from "@/modules/job-board/types";

/** Public search-only key from WTTJ's own frontend. */
const ALGOLIA_APP_ID = "CSEKHVMS53";
const ALGOLIA_API_KEY = "4bd8f6215d0cc52b26430765769e65a0";
const ALGOLIA_INDEX = "wttj_jobs_production_fr";
const ALGOLIA_URL = `https://${ALGOLIA_APP_ID.toLowerCase()}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX}/query`;

const ISO_BY_COUNTRY: Record<string, string> = {
  france: "FR",
  maroc: "MA",
  belgique: "BE",
  suisse: "CH",
  luxembourg: "LU",
  allemagne: "DE",
  "pays-bas": "NL",
  espagne: "ES",
  portugal: "PT",
  italie: "IT",
  "royaume-uni": "GB",
  irlande: "IE",
  canada: "CA",
  emirats: "AE",
};

const EUROPE_ISOS = [
  "FR",
  "BE",
  "CH",
  "LU",
  "DE",
  "NL",
  "ES",
  "PT",
  "IT",
  "GB",
  "IE",
];

type WttjOffice = {
  city?: string;
  country?: string;
  country_code?: string;
};

type WttjOrganization = {
  name?: string;
  slug?: string;
};

export type WttjHit = {
  objectID?: string;
  name?: string;
  slug?: string;
  summary?: string;
  profile?: string;
  published_at?: string;
  remote?: string | null;
  salary_yearly_minimum?: number | null;
  salary_minimum?: number | null;
  salary_maximum?: number | null;
  salary_currency?: string | null;
  experience_level_minimum?: number | null;
  offices?: WttjOffice[];
  organization?: WttjOrganization;
};

type WttjResponse = {
  hits?: WttjHit[];
};

export function wttjCountryFilter(prefs: JobSearchPrefs): string {
  const codes = new Set<string>();
  for (const place of resolveLocations(prefs.locations)) {
    const countryId = place.kind === "city" ? place.countryId : place.id;
    if (countryId === "europe") {
      for (const iso of EUROPE_ISOS) codes.add(iso);
      continue;
    }
    if (countryId === "monde") continue;
    const iso = ISO_BY_COUNTRY[countryId];
    if (iso) codes.add(iso);
  }
  if (codes.size === 0) codes.add("FR");
  return [...codes].map((iso) => `offices.country_code:${iso}`).join(" OR ");
}

export function wttjWorkMode(remote: string | null | undefined): JobWorkMode {
  if (remote === "fulltime" || remote === "full") return "remote";
  if (remote === "partial" || remote === "punctual") return "hybrid";
  return "onsite";
}

function officeLabel(offices: WttjOffice[] | undefined): string {
  const office = offices?.[0];
  if (!office) return "";
  return [office.city, office.country].filter(Boolean).join(", ");
}

function salaryHint(hit: WttjHit): string | undefined {
  const min = hit.salary_yearly_minimum ?? hit.salary_minimum;
  const max = hit.salary_maximum;
  if (!min && !max) return undefined;
  const currency = !hit.salary_currency || hit.salary_currency === "EUR" ? "€" : hit.salary_currency;
  if (min && max && min !== max) {
    return `${formatNumber(Math.round(min))}–${formatNumber(Math.round(max))} ${currency}`;
  }
  return `${formatNumber(Math.round(Number(min || max)))} ${currency}`;
}

export function wttjHitToRaw(hit: WttjHit): RawJobHit | null {
  const title = hit.name?.trim();
  const company = hit.organization?.name?.trim();
  const orgSlug = hit.organization?.slug?.trim();
  const slug = hit.slug?.trim();
  if (!title || !company || !orgSlug || !slug) return null;
  const location = officeLabel(hit.offices);
  const description = [hit.summary, hit.profile].filter(Boolean).join("\n\n");
  const tags: string[] = [];
  if (typeof hit.experience_level_minimum === "number" && hit.experience_level_minimum > 0) {
    tags.push(`exp-min-${Math.round(hit.experience_level_minimum)}`);
  }
  return {
    source: "wttj",
    externalId: hit.objectID || slug,
    company,
    title,
    description,
    url: `https://www.welcometothejungle.com/fr/companies/${orgSlug}/jobs/${slug}`,
    location: location || undefined,
    salaryHint: salaryHint(hit),
    tags,
    publishedAt: hit.published_at || null,
    workMode: wttjWorkMode(hit.remote),
  };
}

function searchQueries(prefs: JobSearchPrefs): string[] {
  return collectorSearchQueries(prefs, 2);
}

async function searchWttj(query: string, filters: string, hitsPerPage = 40): Promise<WttjHit[]> {
  const data = await postJson<WttjResponse>(
    ALGOLIA_URL,
    { query, hitsPerPage, filters },
    {
      timeoutMs: HTTP_TIMEOUTS.slow,
      headers: {
        "x-algolia-application-id": ALGOLIA_APP_ID,
        "x-algolia-api-key": ALGOLIA_API_KEY,
        Origin: "https://www.welcometothejungle.com",
        Referer: "https://www.welcometothejungle.com/",
      },
    },
  );
  return data.hits ?? [];
}

/** Welcome to the Jungle public search — France, Maroc, and nearby countries. */
export async function collectWttj(prefs: JobSearchPrefs): Promise<RawJobHit[]> {
  const queries = searchQueries(prefs);
  if (queries.length === 0) return [];
  const filters = wttjCountryFilter(prefs);
  const selected = expandWithParentCountries(resolveLocations(prefs.locations));
  const batches = await Promise.allSettled(
    queries.map((query) => searchWttj(query, filters)),
  );
  const hits: RawJobHit[] = [];
  const seen = new Set<string>();
  for (const batch of batches) {
    if (batch.status !== "fulfilled") continue;
    for (const raw of batch.value) {
      const hit = wttjHitToRaw(raw);
      if (!hit) continue;
      if (seen.has(hit.url)) continue;
      if (!placeFitsPrefs(selected, hit.location, hit.title, hit.workMode !== "onsite")) {
        continue;
      }
      if (!roleMatchesAny(prefs, hit.title)) continue;
      seen.add(hit.url);
      hits.push(hit);
    }
  }
  return hits;
}

const POOL_QUERIES = [
  "développeur",
  "frontend",
  "backend",
  "fullstack",
  "devops",
  "data engineer",
  "mobile",
  "react",
];

const POOL_COUNTRY_FILTER =
  "offices.country_code:FR OR offices.country_code:MA OR offices.country_code:BE";

/** Broad tech pool for the shared scrape — filtered later by CV. */
export async function collectWttjPool(): Promise<RawJobHit[]> {
  const batches = await Promise.allSettled(
    POOL_QUERIES.map((query) => searchWttj(query, POOL_COUNTRY_FILTER, 50)),
  );
  const hits: RawJobHit[] = [];
  const seen = new Set<string>();
  for (const batch of batches) {
    if (batch.status !== "fulfilled") continue;
    for (const raw of batch.value) {
      const hit = wttjHitToRaw(raw);
      if (!hit || seen.has(hit.url)) continue;
      seen.add(hit.url);
      hits.push(hit);
    }
  }
  return hits;
}
