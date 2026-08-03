import * as cheerio from "cheerio";
import { fetchText } from "@/modules/ai-intel/collectors/fetch";

export type ScrapedJobOffer = {
  title: string | null;
  company: string | null;
  description: string | null;
  location: string | null;
  salaryHint: string | null;
};

function cleanText(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

function metaContent($: cheerio.CheerioAPI, key: string): string | null {
  const value =
    $(`meta[property="${key}"]`).attr("content") ||
    $(`meta[name="${key}"]`).attr("content");
  return value?.trim() || null;
}

/** Fetch readable job posting content from a URL. */
export async function scrapeJobOfferPage(url: string): Promise<ScrapedJobOffer | null> {
  try {
    const html = await fetchText(url, {
      timeoutMs: 14_000,
      headers: { Accept: "text/html,application/xhtml+xml" },
    });
    const $ = cheerio.load(html);

    const title =
      metaContent($, "og:title") ||
      $("h1").first().text().trim() ||
      $("title").first().text().trim() ||
      null;

    const description =
      metaContent($, "og:description") ||
      metaContent($, "description") ||
      null;

    const contentSelectors = [
      "[data-testid='job-description']",
      ".job-description",
      ".description",
      "article",
      "main",
    ];

    let body = "";
    for (const selector of contentSelectors) {
      const block = $(selector).first();
      if (block.length === 0) continue;
      const text = cleanText(block.text());
      if (text.length >= 120) {
        body = text;
        break;
      }
    }

    if (!body) {
      body = $("p")
        .toArray()
        .map((el) => cleanText($(el).text()))
        .filter((p) => p.length >= 40)
        .slice(0, 10)
        .join("\n\n");
    }

    const location =
      metaContent($, "job:location") ||
      $("[class*='location']").first().text().trim() ||
      null;

    const salaryHint =
      $("[class*='salary'], [class*='compensation']")
        .first()
        .text()
        .trim() || null;

    if (!title && !description && !body) return null;

    return {
      title: title ? cleanText(title).slice(0, 240) : null,
      company: null,
      description: cleanText(body || description || "").slice(0, 6000),
      location: location ? cleanText(location).slice(0, 120) : null,
      salaryHint: salaryHint ? cleanText(salaryHint).slice(0, 120) : null,
    };
  } catch {
    return null;
  }
}
