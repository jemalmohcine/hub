import * as cheerio from "cheerio";
import { fetchText, HTTP_TIMEOUTS } from "@/lib/http/fetch-text";
import { extractMainText, metaContent, readOpenGraph } from "@/lib/scrape/page";
import { clampField, collapseWhitespace } from "@/lib/text";

export type ScrapedJobOffer = {
  title: string | null;
  company: string | null;
  description: string | null;
  location: string | null;
  salaryHint: string | null;
};

const DESCRIPTION_SELECTORS = [
  "[data-testid='job-description']",
  ".job-description",
  ".description",
  "article",
  "main",
];

const DESCRIPTION_MAX = 6000;
const SHORT_FIELD_MAX = 120;

/** Fetch readable job posting content from a URL. */
export async function scrapeJobOfferPage(url: string): Promise<ScrapedJobOffer | null> {
  try {
    const html = await fetchText(url, {
      timeoutMs: HTTP_TIMEOUTS.page,
      headers: { Accept: "text/html,application/xhtml+xml" },
    });
    const $ = cheerio.load(html);

    const og = readOpenGraph($);
    const body = extractMainText($, {
      selectors: DESCRIPTION_SELECTORS,
      minLength: 120,
      maxParagraphs: 10,
    });

    if (!og.title && !og.description && !body) return null;

    const location =
      metaContent($, "job:location") ||
      $("[class*='location']").first().text().trim() ||
      null;

    const salaryHint =
      $("[class*='salary'], [class*='compensation']").first().text().trim() ||
      null;

    return {
      title: og.title ? clampField(collapseWhitespace(og.title), "title") : null,
      company: null,
      description: collapseWhitespace(body || og.description || "").slice(
        0,
        DESCRIPTION_MAX,
      ),
      location: location
        ? collapseWhitespace(location).slice(0, SHORT_FIELD_MAX)
        : null,
      salaryHint: salaryHint
        ? collapseWhitespace(salaryHint).slice(0, SHORT_FIELD_MAX)
        : null,
    };
  } catch {
    return null;
  }
}
