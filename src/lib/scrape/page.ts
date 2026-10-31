import type * as cheerio from "cheerio";
import { collapseWhitespace } from "@/lib/text";

/** Read a `<meta property>` or `<meta name>` value. */
export function metaContent($: cheerio.CheerioAPI, key: string): string | null {
  const value =
    $(`meta[property="${key}"]`).attr("content") ||
    $(`meta[name="${key}"]`).attr("content");
  return value?.trim() || null;
}

export type OpenGraph = {
  title: string | null;
  description: string | null;
  siteName: string | null;
};

/** Standard title/description/site extraction with sensible DOM fallbacks. */
export function readOpenGraph($: cheerio.CheerioAPI): OpenGraph {
  return {
    title:
      metaContent($, "og:title") ||
      $("h1").first().text().trim() ||
      $("title").first().text().trim() ||
      null,
    description:
      metaContent($, "og:description") || metaContent($, "description") || null,
    siteName: metaContent($, "og:site_name"),
  };
}

export type MainTextOptions = {
  /** Tried in order; the first block long enough wins. */
  selectors: string[];
  /** Minimum length for a candidate block to be accepted. */
  minLength: number;
  /** Minimum length for a `<p>` to join the fallback. */
  minParagraphLength?: number;
  /** How many paragraphs to keep in the fallback. */
  maxParagraphs?: number;
  /** Normalizer applied to every extracted chunk. Defaults to whitespace collapse. */
  clean?: (raw: string) => string;
};

/**
 * Extract the readable body of a page: first matching content block, or a
 * concatenation of the longest paragraphs when no block qualifies.
 */
export function extractMainText(
  $: cheerio.CheerioAPI,
  opts: MainTextOptions,
): string {
  const clean = opts.clean ?? collapseWhitespace;

  for (const selector of opts.selectors) {
    const block = $(selector).first();
    if (block.length === 0) continue;
    const text = clean(block.text());
    if (text.length >= opts.minLength) return text;
  }

  return $("p")
    .toArray()
    .map((el) => clean($(el).text()))
    .filter((p) => p.length >= (opts.minParagraphLength ?? 40))
    .slice(0, opts.maxParagraphs ?? 8)
    .join("\n\n");
}
