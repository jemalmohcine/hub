import * as cheerio from "cheerio";
import { tryFetchText, HTTP_TIMEOUTS } from "@/lib/http/fetch-text";
import { JOB_BOARD_HEADERS } from "@/modules/job-board/collectors/board-headers";
import {
  isMoroccoPlace,
  resolveLocation,
  resolveLocations,
  type JobLocation,
} from "@/modules/job-board/locations";
import { classifyWorkMode, placeFitsPrefs, roleMatchesAny } from "@/modules/job-board/match";
import { resolveRoles } from "@/modules/job-board/roles";
import type { JobSearchPrefs, RawJobHit } from "@/modules/job-board/types";
import { normalizeWorkModes } from "@/modules/job-board/work-modes";

export type ParsedLinkedInHit = {
  title: string;
  company: string;
  url: string;
  location: string;
  publishedAt: string | null;
};

const LINKEDIN_WT: Record<string, string> = {
  onsite: "1",
  remote: "2",
  hybrid: "3",
};

export function canonicalLinkedInJobUrl(href: string): string {
  const match = href.match(/linkedin\.com\/jobs\/view\/(\d+)/i);
  if (match) return `https://www.linkedin.com/jobs/view/${match[1]}`;
  return href.split("?")[0];
}

export function linkedinPlaceLabel(place: JobLocation): string {
  if (place.kind === "city") {
    const country = resolveLocation(place.countryId).label;
    return `${place.label}, ${country}`;
  }
  return place.label;
}

function searchKeywords(prefs: JobSearchPrefs): string {
  if (prefs.roles.length > 0) {
    return resolveRoles(prefs.roles)[0]?.label || "développeur";
  }
  return prefs.roleQuery.trim() || "développeur";
}

export function linkedinGuestSearchUrl(
  prefs: JobSearchPrefs,
  place: JobLocation,
  start = 0,
): string {
  const params = new URLSearchParams();
  params.set("keywords", searchKeywords(prefs));
  params.set("location", linkedinPlaceLabel(place));
  params.set("start", String(start));
  const modes = normalizeWorkModes(prefs);
  if (modes.length === 1) {
    const wt = LINKEDIN_WT[modes[0] ?? ""];
    if (wt) params.set("f_WT", wt);
  }
  return `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?${params.toString()}`;
}

export function parseLinkedInGuestHtml(html: string): ParsedLinkedInHit[] {
  const $ = cheerio.load(html);
  const hits: ParsedLinkedInHit[] = [];
  const seen = new Set<string>();

  $("li").each((_, el) => {
    const card = $(el);
    const href =
      card.find("a.base-card__full-link").attr("href") ||
      card.find("a[href*='/jobs/view/']").first().attr("href") ||
      "";
    if (!href.includes("/jobs/view/")) return;
    const url = canonicalLinkedInJobUrl(href);
    if (seen.has(url)) return;
    const title = card.find(".base-search-card__title").first().text().trim();
    const company = card.find(".base-search-card__subtitle").first().text().trim();
    if (!title || !company) return;
    const location =
      card.find(".job-search-card__location").first().text().trim() || "Remote";
    const publishedAt =
      card.find("time").attr("datetime")?.trim() ||
      card.find(".job-search-card__listdate").attr("datetime")?.trim() ||
      null;
    seen.add(url);
    hits.push({ title, company, url, location, publishedAt });
  });

  return hits;
}

/** Country-only Maroc → also hit Casablanca and Rabat, where the volume is. */
export function linkedinSearchPlaces(prefs: JobSearchPrefs): JobLocation[] {
  const selected = resolveLocations(prefs.locations);
  const morocco = selected.filter(isMoroccoPlace);
  if (morocco.length > 0) {
    const cities = morocco.filter((entry) => entry.kind === "city");
    if (cities.length > 0) return cities.slice(0, 2);
    return resolveLocations(["casablanca", "rabat", "maroc"]);
  }
  return selected.slice(0, 1);
}

async function collectLinkedInPlace(
  prefs: JobSearchPrefs,
  place: JobLocation,
): Promise<RawJobHit[]> {
  const html = await tryFetchText(linkedinGuestSearchUrl(prefs, place), {
    timeoutMs: HTTP_TIMEOUTS.page,
    headers: JOB_BOARD_HEADERS,
  });
  if (!html || !html.includes("/jobs/view/")) return [];
  const selected = resolveLocations(prefs.locations);
  const hits: RawJobHit[] = [];
  const seen = new Set<string>();

  for (const parsed of parseLinkedInGuestHtml(html)) {
    if (seen.has(parsed.url)) continue;
    if (!placeFitsPrefs(selected, parsed.location, parsed.title, true)) continue;
    if (!roleMatchesAny(prefs, parsed.title)) continue;
    seen.add(parsed.url);
    hits.push({
      source: "linkedin",
      externalId: parsed.url,
      company: parsed.company,
      title: parsed.title,
      description: "",
      url: parsed.url,
      location: parsed.location,
      publishedAt: parsed.publishedAt,
      workMode: classifyWorkMode({
        title: parsed.title,
        description: "",
        location: parsed.location,
      }),
    });
  }
  return hits;
}

/** LinkedIn’s public job cards for the selected city — not the worldwide aggregators. */
export async function collectLinkedIn(prefs: JobSearchPrefs): Promise<RawJobHit[]> {
  const places = linkedinSearchPlaces(prefs);
  if (places.length === 0) return [];
  const batches = await Promise.allSettled(
    places.map((place) => collectLinkedInPlace(prefs, place)),
  );
  const hits: RawJobHit[] = [];
  const seen = new Set<string>();
  for (const batch of batches) {
    if (batch.status !== "fulfilled") continue;
    for (const hit of batch.value) {
      if (seen.has(hit.url)) continue;
      seen.add(hit.url);
      hits.push(hit);
    }
  }
  return hits;
}
