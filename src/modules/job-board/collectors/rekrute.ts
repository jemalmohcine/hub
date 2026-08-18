import * as cheerio from "cheerio";
import { absoluteUrl, tryFetchText, HTTP_TIMEOUTS } from "@/lib/http/fetch-text";
import { JOB_BOARD_HEADERS } from "@/modules/job-board/collectors/board-headers";
import {
  isMoroccoPlace,
  resolveLocations,
} from "@/modules/job-board/locations";
import { classifyWorkMode, placeFitsPrefs, roleMatchesAny } from "@/modules/job-board/match";
import { resolveRoles } from "@/modules/job-board/roles";
import type { JobSearchPrefs, RawJobHit } from "@/modules/job-board/types";

export type ParsedRekruteHit = {
  title: string;
  company: string;
  url: string;
  location: string;
  description: string;
  publishedAt: string | null;
};

const BASE = "https://www.rekrute.com";

/** Rekrute prints `12/08/2026` (day/month/year). */
export function parseRekruteDate(raw: string): string | null {
  const match = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const iso = `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}T00:00:00.000Z`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : iso;
}

export function parseRekruteTitle(raw: string): { title: string; location: string } {
  const [head, ...rest] = raw.split("|").map((part) => part.trim()).filter(Boolean);
  const title = head || raw.trim();
  const location = rest.join(" | ") || "Maroc";
  return { title, location };
}

export function parseRekruteSearchHtml(html: string): ParsedRekruteHit[] {
  const $ = cheerio.load(html);
  const hits: ParsedRekruteHit[] = [];
  const seen = new Set<string>();

  $("li.post-id").each((_, el) => {
    const card = $(el);
    const link = card.find("a.titreJob").first();
    const href = link.attr("href")?.split("#")[0]?.trim() ?? "";
    if (!href) return;
    const url = absoluteUrl(BASE, href);
    if (seen.has(url)) return;
    const parsed = parseRekruteTitle(link.text());
    if (!parsed.title) return;
    const company =
      card.find("img.photo").attr("alt")?.trim() ||
      card.find("img.photo").attr("title")?.trim() ||
      "Entreprise";
    const description = card.find(".info span").first().text().trim();
    const publishedAt = parseRekruteDate(card.find("em.date span").first().text());
    seen.add(url);
    hits.push({
      title: parsed.title,
      company,
      url,
      location: parsed.location,
      description,
      publishedAt,
    });
  });

  return hits;
}

function searchQueries(prefs: JobSearchPrefs): string[] {
  if (prefs.roles.length > 0) {
    return resolveRoles(prefs.roles)
      .map((role) => role.label)
      .filter((label) => label.length >= 2)
      .slice(0, 2);
  }
  const fallback = prefs.roleQuery.trim();
  return fallback ? [fallback] : ["développeur"];
}

export function rekruteSearchUrl(query: string): string {
  const params = new URLSearchParams({
    s: "1",
    p: "1",
    o: "1",
    query,
    keyword: query,
  });
  return `${BASE}/offres.html?${params.toString()}`;
}

export function wantsRekrute(prefs: JobSearchPrefs): boolean {
  const selected = resolveLocations(prefs.locations);
  if (selected.length === 0) return false;
  return selected.some(isMoroccoPlace);
}

async function collectRekruteQuery(
  query: string,
  prefs: JobSearchPrefs,
): Promise<RawJobHit[]> {
  const html = await tryFetchText(rekruteSearchUrl(query), {
    timeoutMs: HTTP_TIMEOUTS.page,
    headers: JOB_BOARD_HEADERS,
  });
  if (!html || !html.includes("titreJob")) return [];
  const selected = resolveLocations(prefs.locations);
  const hits: RawJobHit[] = [];
  const seen = new Set<string>();

  for (const parsed of parseRekruteSearchHtml(html)) {
    if (seen.has(parsed.url)) continue;
    if (!placeFitsPrefs(selected, parsed.location, parsed.title, false)) continue;
    if (!roleMatchesAny(prefs, parsed.title)) continue;
    seen.add(parsed.url);
    hits.push({
      source: "rekrute",
      externalId: parsed.url,
      company: parsed.company,
      title: parsed.title,
      description: parsed.description,
      url: parsed.url,
      location: parsed.location,
      publishedAt: parsed.publishedAt,
      workMode: classifyWorkMode({
        title: parsed.title,
        description: parsed.description,
        location: parsed.location,
      }),
    });
  }
  return hits;
}

/** Morocco’s main board — search HTML, not a third-party dump. */
export async function collectRekrute(prefs: JobSearchPrefs): Promise<RawJobHit[]> {
  if (!wantsRekrute(prefs)) return [];
  const batches = await Promise.allSettled(
    searchQueries(prefs).map((query) => collectRekruteQuery(query, prefs)),
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
