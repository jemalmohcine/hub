import * as cheerio from "cheerio";
import { HTTP_TIMEOUTS } from "@/lib/http/fetch-text";
import { hasFirecrawl, scrapePage } from "@/lib/scrape/firecrawl";
import { extractMainText, readOpenGraph } from "@/lib/scrape/page";
import { FIELD_LIMITS, clampField } from "@/lib/text";
import { isEssentialAiIntelUrl } from "@/modules/ai-intel/essential-hosts";
import { decodeHtmlEntities, sanitizePlainText } from "@/modules/ai-intel/html-to-text";

export type ScrapedArticle = {
  title: string | null;
  description: string | null;
  content: string | null;
  siteName: string | null;
  scrapedVia: "firecrawl" | "direct";
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

const DEFAULT_FIRECRAWL_PAGES = 20;

let firecrawlPagesLeft = Number(
  process.env.AI_INTEL_FIRECRAWL_PAGES || DEFAULT_FIRECRAWL_PAGES,
);
let firecrawlUsed = 0;
let firecrawlFallback = 0;

export function resetFirecrawlArticleBudget() {
  firecrawlPagesLeft = Number(
    process.env.AI_INTEL_FIRECRAWL_PAGES || DEFAULT_FIRECRAWL_PAGES,
  );
  firecrawlUsed = 0;
  firecrawlFallback = 0;
}

export function firecrawlArticleStats() {
  return {
    used: firecrawlUsed,
    fallback: firecrawlFallback,
    remaining: firecrawlPagesLeft,
  };
}

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

function takeFirecrawlSlot(url: string): boolean {
  if (!hasFirecrawl()) return false;
  if (!isEssentialAiIntelUrl(url)) return false;
  if (firecrawlPagesLeft <= 0) return false;
  firecrawlPagesLeft -= 1;
  return true;
}

/** Fetch and extract readable article content from a URL. */
export async function scrapeArticlePage(url: string): Promise<ScrapedArticle | null> {
  try {
    const useFirecrawl = takeFirecrawlSlot(url);
    const page = await scrapePage(url, {
      onlyMainContent: true,
      timeoutMs: HTTP_TIMEOUTS.scrape,
      via: useFirecrawl ? "firecrawl" : "direct",
    });

    if (useFirecrawl && page.source === "firecrawl") firecrawlUsed += 1;
    if (useFirecrawl && page.source === "direct") firecrawlFallback += 1;

    const $ = cheerio.load(page.html);

    const og = readOpenGraph($);
    const title = page.title || og.title;
    const description = page.description || og.description;
    const siteName = page.siteName || og.siteName;
    const content =
      (page.markdown && page.markdown.length >= 200
        ? cleanText(page.markdown)
        : "") ||
      extractMainText($, {
        selectors: CONTENT_SELECTORS,
        minLength: 200,
        clean: cleanText,
      });

    if (!title && !description && !content) return null;

    return {
      title: title ? clampField(cleanText(title), "title") : null,
      description: description ? cleanText(description).slice(0, 500) : null,
      content: content ? content.slice(0, FIELD_LIMITS.body) : null,
      siteName: siteName ? clampField(cleanText(siteName), "name") : null,
      scrapedVia: page.source,
    };
  } catch {
    return null;
  }
}
