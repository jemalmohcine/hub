import * as cheerio from "cheerio";
import {
  absoluteUrl,
  fetchText,
} from "@/modules/ai-intel/collectors/fetch";
import type { RawHit } from "@/modules/ai-intel/types";

export async function collectGenericHtmlList(
  sourceId: string,
  url: string,
): Promise<RawHit[]> {
  const html = await fetchText(url);
  const $ = cheerio.load(html);
  const hits: RawHit[] = [];

  $("article a[href], h2 a[href], h3 a[href], li a[href]").each((_, el) => {
    if (hits.length >= 45) return;
    const href = $(el).attr("href");
    if (!href || href.startsWith("#")) return;
    const abs = absoluteUrl(url, href);
    const title = $(el).text().replace(/\s+/g, " ").trim();
    if (title.length < 12 || title.length > 180) return;
    if (hits.some((h) => h.url === abs)) return;
    hits.push({
      title,
      summary: "",
      url: abs,
      sourceId,
      externalId: abs,
      publishedAt: new Date().toISOString(),
      raw: { provider: sourceId, kind: "news" },
    });
  });

  return hits;
}
