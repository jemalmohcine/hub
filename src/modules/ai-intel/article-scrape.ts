import * as cheerio from "cheerio";
import { HTTP_TIMEOUTS } from "@/lib/http/fetch-text";
import {
  hasFirecrawl,
  isFirecrawlCircuitOpen,
  resetFirecrawlCircuit,
  scrapePage,
} from "@/lib/scrape/firecrawl";
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
  resetFirecrawlCircuit();
}

export function firecrawlArticleStats() {
  return {
    used: firecrawlUsed,
    fallback: firecrawlFallback,
    remaining: firecrawlPagesLeft,
    circuitOpen: isFirecrawlCircuitOpen(),
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

const DIRECT_SUMMARY_CAP = 700;

function takeFirecrawlSlot(url: string): boolean {
  if (!hasFirecrawl()) return false;
  if (isFirecrawlCircuitOpen()) return false;
  if (!isEssentialAiIntelUrl(url)) return false;
  if (firecrawlPagesLeft <= 0) return false;
  return true;
}

/** Fetch a short "what it does" blurb. The source link is the full article. */
export async function scrapeArticlePage(url: string): Promise<ScrapedArticle | null> {
  try {
    const useFirecrawl = takeFirecrawlSlot(url);
    const page = await scrapePage(url, {
      onlyMainContent: true,
      timeoutMs: HTTP_TIMEOUTS.scrape,
      via: useFirecrawl ? "firecrawl" : "direct",
    });

    if (useFirecrawl && page.source === "firecrawl") {
      firecrawlPagesLeft -= 1;
      firecrawlUsed += 1;
    }
    if (useFirecrawl && page.source === "direct") firecrawlFallback += 1;

    const $ = cheerio.load(page.html);

    const og = readOpenGraph($);
    const title = page.title || og.title;
    const description = page.description || og.description;
    const siteName = page.siteName || og.siteName;

    // Native HTML is noisy. Keep title + OG description; the card only needs
    // "what it does". Firecrawl markdown is clean enough to feed the LLM.
    const content =
      page.source === "firecrawl" && page.markdown && page.markdown.length >= 120
        ? cleanText(page.markdown).slice(0, FIELD_LIMITS.body)
        : (
            (description && description.length >= 40 ? cleanText(description) : "") ||
            extractMainText($, {
              selectors: CONTENT_SELECTORS,
              minLength: 80,
              maxParagraphs: 3,
              minParagraphLength: 40,
              clean: cleanText,
            })
          ).slice(0, DIRECT_SUMMARY_CAP);

    if (!title && !description && !content) return null;

    return {
      title: title ? clampField(cleanText(title), "title") : null,
      description: description ? cleanText(description).slice(0, 280) : null,
      content: content || null,
      siteName: siteName ? clampField(cleanText(siteName), "name") : null,
      scrapedVia: page.source,
    };
  } catch {
    return null;
  }
}
