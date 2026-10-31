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

/**
 * Wordings vendors actually use for a permanent free plan, including the
 * `FreeProScale` run-together column headers that pricing tables collapse to
 * once the markup is stripped.
 */
const FREE_PLAN = new RegExp(
  [
    "\\b(?:free (?:plan|tier|forever|for ever))",
    "\\bstart(?:ing)? for free\\b",
    "\\bplan gratuit\\b",
    "\\bgratuit à vie\\b",
    "\\bhobby\\b[^.]{0,30}(?:\\$0|free|gratuit)",
    "\\bcommunity edition\\b",
    "\\$0\\b",
    "\\b0 ?€",
    "Free(?=(?:Pro|Team|Scale|Starter|Business|Enterprise|Plus|Growth|Premium))",
  ].join("|"),
  "i",
);

/** Trials are not a free tier and must not be reported as one. */
const TRIAL_ONLY = /\b(free trial|essai gratuit|\d+[- ]day trial|trial period)\b/i;

export function detectFreeTier(text: string): { hasFreeTier: boolean; note: string | null } {
  const match = FREE_PLAN.exec(text);
  if (!match) return { hasFreeTier: false, note: null };

  const around = collapseWhitespace(text.slice(match.index, match.index + 240));
  if (TRIAL_ONLY.test(around) && !/free (plan|tier)/i.test(around)) {
    return { hasFreeTier: false, note: null };
  }

  return { hasFreeTier: true, note: looksReadable(around) ? truncateAtWord(around, 180) : null };
}

/**
 * Comparison tables collapse to run-together text like `FreeProScaleDaily
 * limit100` once the markup is gone. Detecting the free plan from that is
 * fine; showing it to the user is not.
 */
function looksReadable(text: string): boolean {
  const sample = text.slice(0, 120);
  const spaces = sample.split(" ").length - 1;
  return spaces / sample.length >= 0.08;
}

const AMOUNT = String.raw`(?:[$€£]\s?(\d{1,4}(?:[.,]\d{1,2})?)|(\d{1,4}(?:[.,]\d{1,2})?)\s?(?:€|\$|USD|EUR))`;
const PER_MONTH = String.raw`\s?(?:\/|par |per )\s?(?:mo\b|month|mois)`;

const MONTHLY_PRICE = new RegExp(AMOUNT + PER_MONTH, "gi");
const ANY_PRICE = new RegExp(AMOUNT, "gi");

/** Below this, an amount is a per-unit rate rather than the price of a plan. */
const MIN_PLAN_PRICE = 3;
const MAX_PLAN_PRICE = 2_000;

function cheapestMatch(text: string, pattern: RegExp, floor: number): number | null {
  let cheapest: number | null = null;

  for (const match of text.matchAll(pattern)) {
    const raw = match[1] ?? match[2];
    if (!raw) continue;
    const value = Number(raw.replace(",", "."));
    if (!Number.isFinite(value) || value < floor || value > MAX_PLAN_PRICE) continue;
    cheapest = cheapest == null ? value : Math.min(cheapest, value);
  }

  return cheapest;
}

/**
 * Cheapest paid plan on the page. Amounts explicitly tagged per month win;
 * without one, per-unit rates like "$0.01 / GB" would be read as a plan price.
 */
export function detectStartingPrice(text: string): number | null {
  return (
    cheapestMatch(text, MONTHLY_PRICE, 1) ?? cheapestMatch(text, ANY_PRICE, MIN_PLAN_PRICE)
  );
}
