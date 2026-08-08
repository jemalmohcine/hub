import * as cheerio from "cheerio";
import { HTTP_TIMEOUTS, tryFetchText } from "@/lib/http/fetch-text";
import { extractMainText } from "@/lib/scrape/page";
import { collapseWhitespace, truncateAtWord } from "@/lib/text";

/**
 * Reads a vendor's own pricing page. The heuristics below are the fallback
 * when no LLM is configured — they are deliberately conservative, because
 * "we think it might be free" is worse than "we don't know".
 */

const MAX_PRICING_CHARS = 6_000;

export async function scrapePricingText(url: string): Promise<string | null> {
  const html = await tryFetchText(url, { timeoutMs: HTTP_TIMEOUTS.page });
  if (!html) return null;

  const $ = cheerio.load(html);
  $("script, style, noscript, svg, nav, footer").remove();

  const text = extractMainText($, {
    selectors: ["main", "[class*='pricing']", "[id*='pricing']", "article", "body"],
    minLength: 200,
    minParagraphLength: 20,
    maxParagraphs: 40,
  });

  const cleaned = collapseWhitespace(text);
  return cleaned.length >= 120 ? cleaned.slice(0, MAX_PRICING_CHARS) : null;
}

/** Wordings vendors actually use for a permanent free plan. */
const FREE_PLAN =
  /\b(free (plan|tier|forever|for ever)|plan gratuit|gratuit à vie|hobby plan|community edition|starter free|\$0 ?\/|0 ?€ ?\/|free — |free\b[^.]{0,20}\bforever)/i;

/** Trials are not a free tier and must not be reported as one. */
const TRIAL_ONLY = /\b(free trial|essai gratuit|\d+[- ]day trial|trial period)\b/i;

export function detectFreeTier(text: string): { hasFreeTier: boolean; note: string | null } {
  const match = FREE_PLAN.exec(text);
  if (!match) return { hasFreeTier: false, note: null };

  const start = Math.max(0, match.index - 60);
  const around = collapseWhitespace(text.slice(start, match.index + 220));
  const trialOnly = TRIAL_ONLY.test(around) && !/free (plan|tier)/i.test(around);

  if (trialOnly) return { hasFreeTier: false, note: null };
  return { hasFreeTier: true, note: truncateAtWord(around, 180) };
}

const PRICE = /(?:[$€£]\s?(\d{1,4}(?:[.,]\d{1,2})?)|(\d{1,4}(?:[.,]\d{1,2})?)\s?(?:€|\$|USD|EUR))/g;

/**
 * Lowest non-zero monthly amount on the page. Anything above 2 000 is almost
 * always an annual or enterprise figure, so it is ignored.
 */
export function detectStartingPrice(text: string): number | null {
  let cheapest: number | null = null;

  for (const match of text.matchAll(PRICE)) {
    const raw = match[1] ?? match[2];
    if (!raw) continue;
    const value = Number(raw.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0 || value > 2_000) continue;
    cheapest = cheapest == null ? value : Math.min(cheapest, value);
  }

  return cheapest;
}
