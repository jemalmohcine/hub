import { decodeXmlEntities, fetchText, HTTP_TIMEOUTS } from "@/lib/http/fetch-text";
import {
  expandWithParentCountries,
  resolveLocations,
} from "@/modules/job-board/locations";
import { placeFitsPrefs, roleMatchesAny } from "@/modules/job-board/match";
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

function parseWwrTitle(raw: string): { company: string; title: string } {
  const cleaned = cleanText(raw);
  const cut = cleaned.indexOf(": ");
  if (cut <= 0) return { company: "Entreprise", title: cleaned };
  return {
    company: cleaned.slice(0, cut).trim() || "Entreprise",
    title: cleaned.slice(cut + 2).trim() || cleaned,
  };
}

/**
 * We Work Remotely programming RSS — no key, remote-only.
 */
export async function collectWwr(prefs: JobSearchPrefs): Promise<RawJobHit[]> {
  if (!wantsRemote(prefs)) return [];
  const xml = await fetchText(
    "https://weworkremotely.com/categories/remote-programming-jobs.rss",
    { timeoutMs: HTTP_TIMEOUTS.slow },
  );
  const selected = expandWithParentCountries(resolveLocations(prefs.locations));
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];

  return items.flatMap((block) => {
    const parsed = parseWwrTitle(tagContent(block, "title"));
    const link = tagContent(block, "link");
    if (!parsed.title || !link.startsWith("http")) return [];
    const description = cleanText(tagContent(block, "description"));
    const locationMatch = description.match(
      /\b(location|region|headquarters)\s*:\s*([^.<]{2,60})/i,
    );
    const location = locationMatch?.[2]?.trim() || "Remote · Worldwide";
    if (!placeFitsPrefs(selected, location, parsed.title, true)) return [];
    if (!roleMatchesAny(prefs, parsed.title)) return [];

    const published = tagContent(block, "pubDate");
    let publishedAt: string | null = null;
    if (published) {
      const date = new Date(published);
      if (!Number.isNaN(date.getTime())) publishedAt = date.toISOString();
    }

    return [
      {
        source: "wwr",
        externalId: link,
        company: parsed.company,
        title: parsed.title,
        description,
        url: link,
        location,
        publishedAt,
        workMode: "remote" as const,
      },
    ];
  });
}
