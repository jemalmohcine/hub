import {
  decodeXmlEntities,
  fetchText,
} from "@/modules/ai-intel/collectors/fetch";
import type { RawHit } from "@/modules/ai-intel/types";

function tagContent(block: string, tag: string): string {
  const re = new RegExp(
    `<${tag}[^>]*>([\\s\\S]*?)</${tag}>`,
    "i",
  );
  const m = block.match(re);
  return m ? decodeXmlEntities(m[1]) : "";
}

/** HTML/CDATA → clean readable text. */
function cleanText(raw: string): string {
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|li|h[1-6]|div)>/gi, ". ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .replace(/\s([.,;:!?])/g, "$1")
    .replace(/\.\s*\./g, ".")
    .trim();
}

function linkFromItem(block: string): string {
  const plain = tagContent(block, "link");
  if (plain && /^https?:\/\//i.test(plain)) return plain;
  const atom = block.match(/<link[^>]+href=["']([^"']+)["']/i);
  if (atom?.[1]) return decodeXmlEntities(atom[1]);
  const guid = tagContent(block, "guid");
  if (guid && /^https?:\/\//i.test(guid)) return guid;
  return plain;
}

export async function collectRss(
  sourceId: string,
  feedUrl: string,
  limit = 25,
): Promise<RawHit[]> {
  const xml = await fetchText(feedUrl);
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) ??
    xml.match(/<entry[\s\S]*?<\/entry>/gi) ??
    [];

  return items.slice(0, limit).flatMap((block) => {
    const title = tagContent(block, "title");
    const url = linkFromItem(block);
    if (!title || !url) return [];
    // Prefer the richest field: full content beats the one-line description
    const summary =
      cleanText(tagContent(block, "content:encoded")) ||
      cleanText(tagContent(block, "description")) ||
      cleanText(tagContent(block, "summary")) ||
      cleanText(tagContent(block, "content")) ||
      "";
    const published =
      tagContent(block, "pubDate") ||
      tagContent(block, "published") ||
      tagContent(block, "updated") ||
      null;
    let publishedAt: string | null = null;
    if (published) {
      const d = new Date(published);
      if (!Number.isNaN(d.getTime())) publishedAt = d.toISOString();
    }
    return [
      {
        title: cleanText(title).slice(0, 240),
        summary: summary.slice(0, 700),
        url,
        sourceId,
        externalId: url,
        publishedAt,
      },
    ];
  });
}
