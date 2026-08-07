import * as cheerio from "cheerio";
import { fetchText, HTTP_TIMEOUTS } from "@/lib/http/fetch-text";
import { extractMainText, readOpenGraph } from "@/lib/scrape/page";
import { FIELD_LIMITS, clampField } from "@/lib/text";
import { decodeHtmlEntities, sanitizePlainText } from "@/modules/ai-intel/html-to-text";

export type ScrapedArticle = {
  title: string | null;
  description: string | null;
  content: string | null;
  siteName: string | null;
};

const CONTENT_SELECTORS = [
  "article",
  "main article",
  "[role='main']",
  "main",
  ".post-content",
  ".article-content",
  ".entry-content",
  "#content",
];

function cleanText(raw: string): string {
  return sanitizePlainText(
    decodeHtmlEntities(raw)
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
      .replace(/<(script|style|nav|footer|header|aside)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|li|h[1-6]|div|section|article)>/gi, "\n"),
    FIELD_LIMITS.body,
  );
}

/** Fetch and extract readable article content from a URL. */
export async function scrapeArticlePage(url: string): Promise<ScrapedArticle | null> {
  try {
    const html = await fetchText(url, {
      timeoutMs: HTTP_TIMEOUTS.api,
      headers: { Accept: "text/html,application/xhtml+xml" },
    });
    const $ = cheerio.load(html);

    const og = readOpenGraph($);
    const content = extractMainText($, {
      selectors: CONTENT_SELECTORS,
      minLength: 200,
      clean: cleanText,
    });

    if (!og.title && !og.description && !content) return null;

    return {
      title: og.title ? clampField(cleanText(og.title), "title") : null,
      description: og.description
        ? cleanText(og.description).slice(0, 500)
        : null,
      content: content ? content.slice(0, FIELD_LIMITS.body) : null,
      siteName: og.siteName ? clampField(cleanText(og.siteName), "name") : null,
    };
  } catch {
    return null;
  }
}
