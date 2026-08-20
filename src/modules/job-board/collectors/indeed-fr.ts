import { decodeXmlEntities, tryFetchText } from "@/lib/http/fetch-text";
import {
  expandWithParentCountries,
  resolveLocations,
} from "@/modules/job-board/locations";
import { boardSearchQueries } from "@/modules/job-board/scrape-query";
import type { JobSearchPrefs, RawJobHit } from "@/modules/job-board/types";
import { wantsRemote } from "@/modules/job-board/work-modes";

function tagContent(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = block.match(re);
  return m ? decodeXmlEntities(m[1]) : "";
}

function cleanText(raw: string): string {
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const INDEED_HOST: Record<string, string> = {
  france: "fr.indeed.com",
  maroc: "ma.indeed.com",
  belgique: "be.indeed.com",
  suisse: "ch.indeed.com",
  canada: "ca.indeed.com",
  allemagne: "de.indeed.com",
  "pays-bas": "nl.indeed.com",
  espagne: "es.indeed.com",
  portugal: "pt.indeed.com",
  italie: "it.indeed.com",
  "royaume-uni": "uk.indeed.com",
  "emirats": "ae.indeed.com",
};

function indeedHostFor(locationId: string, countryId: string): string {
  return INDEED_HOST[locationId] ?? INDEED_HOST[countryId] ?? "fr.indeed.com";
}

/** Indeed RSS titles look like `Title - Company - Place`. */
export function parseIndeedRssTitle(titleRaw: string): {
  title: string;
  company: string;
  location: string;
} {
  const parts = titleRaw.split(" - ");
  const title = parts[0]?.trim() || titleRaw;
  const company = parts[1]?.replace(/Indeed\.com$/i, "").trim() || "Entreprise";
  const location =
    parts.length >= 3
      ? parts.slice(2).join(" - ").replace(/Indeed\.com$/i, "").trim()
      : "";
  return { title, company, location };
}

function indeedQueries(prefs: JobSearchPrefs): string[] {
  const queries = boardSearchQueries(prefs, 3);
  return queries.length > 0 ? queries : ["développeur"];
}

function indeedTargets(prefs: JobSearchPrefs): { query: string; location: string; host: string }[] {
  const selected = resolveLocations(prefs.locations);
  const expanded =
    wantsRemote(prefs) ? expandWithParentCountries(selected) : selected;
  const places =
    expanded.length > 0
      ? expanded.slice(0, 5)
      : [{ indeed: "France", id: "france", countryId: "france" as const }];
  const queries = indeedQueries(prefs);
  const targets: { query: string; location: string; host: string }[] = [];
  for (const place of places) {
    const host = indeedHostFor(place.id ?? "france", place.countryId ?? "france");
    for (const query of queries) {
      targets.push({ query, location: place.indeed, host });
      if (targets.length >= 2) return targets;
    }
  }
  return targets;
}

async function collectIndeedLocation(
  query: string,
  location: string,
  host: string,
): Promise<RawJobHit[]> {
  const url = `https://${host}/rss?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`;
  const xml = await tryFetchText(url, { timeoutMs: 4_000 });
  if (!xml || /security check/i.test(xml) || !xml.includes("<item")) return [];
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];

  return items.slice(0, 25).flatMap((block) => {
    const titleRaw = cleanText(tagContent(block, "title"));
    const link = tagContent(block, "link") || tagContent(block, "guid");
    if (!titleRaw || !link.startsWith("http")) return [];

    const parsed = parseIndeedRssTitle(titleRaw);
    const description = cleanText(tagContent(block, "description"));
    const published = tagContent(block, "pubDate");
    let publishedAt: string | null = null;
    if (published) {
      const date = new Date(published);
      if (!Number.isNaN(date.getTime())) publishedAt = date.toISOString();
    }

    return [
      {
        source: "indeed-fr",
        externalId: link,
        company: parsed.company,
        title: parsed.title,
        description,
        url: link,
        location: parsed.location || location,
        publishedAt,
      },
    ];
  });
}

/**
 * Indeed France RSS — one request per selected city/country, role as the query.
 */
export async function collectIndeedFr(prefs: JobSearchPrefs): Promise<RawJobHit[]> {
  const batches = await Promise.allSettled(
    indeedTargets(prefs).map((target) =>
      collectIndeedLocation(target.query, target.location, target.host),
    ),
  );
  return batches.flatMap((batch) => (batch.status === "fulfilled" ? batch.value : []));
}
