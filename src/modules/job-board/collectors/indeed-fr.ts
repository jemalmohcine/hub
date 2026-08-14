import { decodeXmlEntities, fetchText, HTTP_TIMEOUTS } from "@/lib/http/fetch-text";
import type { JobSearchPrefs, RawJobHit } from "@/modules/job-board/types";

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

/**
 * Indeed France RSS — city + query, the most useful public feed for FR roles.
 */
export async function collectIndeedFr(prefs: JobSearchPrefs): Promise<RawJobHit[]> {
  const q = prefs.roleQuery.trim() || "développeur";
  const location =
    prefs.workMode === "remote"
      ? prefs.city.trim() || "France"
      : prefs.city.trim() || "France";
  const query =
    prefs.workMode === "remote"
      ? `${q} télétravail`
      : prefs.workMode === "hybrid"
        ? `${q} hybride`
        : q;

  const url = `https://fr.indeed.com/rss?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`;
  const xml = await fetchText(url, { timeoutMs: HTTP_TIMEOUTS.slow });
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];

  return items.slice(0, 40).flatMap((block) => {
    const titleRaw = cleanText(tagContent(block, "title"));
    const link = tagContent(block, "link") || tagContent(block, "guid");
    if (!titleRaw || !link.startsWith("http")) return [];

    const parts = titleRaw.split(" - ");
    const title = parts[0]?.trim() || titleRaw;
    const company = parts[1]?.replace(/Indeed\.com$/i, "").trim() || "Entreprise";
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
        company,
        title,
        description,
        url: link,
        location,
        publishedAt,
        workMode: prefs.workMode,
      },
    ];
  });
}
