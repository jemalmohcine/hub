import * as cheerio from "cheerio";
import { tryFetchText, HTTP_TIMEOUTS } from "@/lib/http/fetch-text";
import { JOB_BOARD_HEADERS } from "@/modules/job-board/collectors/board-headers";
import {
  expandMoroccoCountry,
  isMoroccoPlace,
  resolveLocation,
  resolveLocations,
  type JobLocation,
} from "@/modules/job-board/locations";
import { classifyWorkMode, placeFitsPrefs, roleMatchesAny } from "@/modules/job-board/match";
import { linkedinSearchKeywords } from "@/modules/job-board/scrape-query";
import type { JobSearchPrefs, RawJobHit } from "@/modules/job-board/types";
import { normalizeWorkModes } from "@/modules/job-board/work-modes";

export type ParsedLinkedInHit = {
  title: string;
  company: string;
  url: string;
  location: string;
  publishedAt: string | null;
};

const LINKEDIN_REMOTE_WT = "2";

export function canonicalLinkedInJobUrl(href: string): string {
  const match = href.match(/\/jobs\/view\/(?:[\w%-]+-)?(\d{5,})/i);
  if (match) return `https://www.linkedin.com/jobs/view/${match[1]}`;
  return href.split("?")[0];
}

export function linkedinPlaceLabel(place: JobLocation): string {
  if (place.kind === "city") {
    const country = resolveLocation(place.countryId);
    const city = place.indeed || place.label;
    const countryLabel = country.indeed || country.label;
    return `${city}, ${countryLabel}`;
  }
  return place.indeed || place.label;
}

export function searchKeywords(prefs: JobSearchPrefs): string {
  return linkedinSearchKeywords(prefs);
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
  // Guest cards rarely label hybrid/onsite. Restricting f_WT hides Casablanca CDI.
  if (modes.length === 1 && modes[0] === "remote") {
    params.set("f_WT", LINKEDIN_REMOTE_WT);
  }
  return `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?${params.toString()}`;
}

function readLinkedInCard(
  card: ReturnType<ReturnType<typeof cheerio.load>>,
  seen: Set<string>,
): ParsedLinkedInHit | null {
  const href =
    card.find("a.base-card__full-link").attr("href") ||
    card.find("a[href*='/jobs/view/']").first().attr("href") ||
    "";
  if (!href.includes("/jobs/view/")) return null;
  const url = canonicalLinkedInJobUrl(href);
  if (seen.has(url)) return null;
  const title = card.find(".base-search-card__title").first().text().trim();
  const company = card.find(".base-search-card__subtitle").first().text().trim();
  if (!title || !company) return null;
  const location =
    card.find(".job-search-card__location").first().text().trim() || "Remote";
  const publishedAt =
    card.find("time").attr("datetime")?.trim() ||
    card.find(".job-search-card__listdate").attr("datetime")?.trim() ||
    null;
  seen.add(url);
  return { title, company, url, location, publishedAt };
}

export function parseLinkedInGuestHtml(html: string): ParsedLinkedInHit[] {
  const $ = cheerio.load(html);
  const hits: ParsedLinkedInHit[] = [];
  const seen = new Set<string>();

  $("li, .base-search-card, .base-card").each((_, el) => {
    const parsed = readLinkedInCard($(el), seen);
    if (parsed) hits.push(parsed);
  });

  return hits;
}

/** Morocco is one market: country search plus the cities that actually have volume. */
const MOROCCO_LINKEDIN_HUBS = ["maroc", "casablanca", "rabat", "marrakech"];

export function linkedinSearchPlaces(prefs: JobSearchPrefs): JobLocation[] {
  const selected = resolveLocations(prefs.locations);
  if (selected.some(isMoroccoPlace)) {
    const extra = selected.filter(isMoroccoPlace).map((entry) => entry.id);
    return resolveLocations([...MOROCCO_LINKEDIN_HUBS, ...extra], 5);
  }
  return selected.slice(0, 1);
}

const LINKEDIN_GUEST_PAGES = 3;
const LINKEDIN_GUEST_PAGE_SIZE = 25;

function rawHitFromParsed(
  parsed: ParsedLinkedInHit,
  prefs: JobSearchPrefs,
  selected: ReturnType<typeof resolveLocations>,
  seen: Set<string>,
): RawJobHit | null {
  if (seen.has(parsed.url)) return null;
  if (!placeFitsPrefs(selected, parsed.location, parsed.title, true)) return null;
  if (!roleMatchesAny(prefs, parsed.title)) return null;
  seen.add(parsed.url);
  return {
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
  };
}

async function collectLinkedInPlace(
  prefs: JobSearchPrefs,
  place: JobLocation,
): Promise<RawJobHit[]> {
  const selected = expandMoroccoCountry(resolveLocations(prefs.locations));
  const hits: RawJobHit[] = [];
  const seen = new Set<string>();

  for (let page = 0; page < LINKEDIN_GUEST_PAGES; page += 1) {
    const html = await tryFetchText(
      linkedinGuestSearchUrl(prefs, place, page * LINKEDIN_GUEST_PAGE_SIZE),
      {
        timeoutMs: HTTP_TIMEOUTS.page,
        headers: JOB_BOARD_HEADERS,
      },
    );
    if (!html || !html.includes("/jobs/view/")) break;
    const parsed = parseLinkedInGuestHtml(html);
    if (parsed.length === 0) break;
    for (const item of parsed) {
      const hit = rawHitFromParsed(item, prefs, selected, seen);
      if (hit) hits.push(hit);
    }
    if (parsed.length < 8) break;
  }
  return hits;
}

/** LinkedIn public cards for Morocco (country + hub cities) or the selected place. */
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
