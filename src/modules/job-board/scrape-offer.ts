import * as cheerio from "cheerio";
import { HTTP_TIMEOUTS } from "@/lib/http/fetch-text";
import { scrapePage } from "@/lib/scrape/firecrawl";
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

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function typeList(node: Record<string, unknown>): string[] {
  const raw = node["@type"];
  if (typeof raw === "string") return [raw];
  if (Array.isArray(raw)) return raw.filter((item): item is string => typeof item === "string");
  return [];
}

function flattenJsonLd(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap(flattenJsonLd);
  const node = asRecord(value);
  if (!node) return [];
  const graph = node["@graph"];
  if (Array.isArray(graph)) return [node, ...graph.flatMap(flattenJsonLd)];
  return [node];
}

function textOf(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return collapseWhitespace(value);
  const node = asRecord(value);
  if (!node) return null;
  if (typeof node.name === "string") return collapseWhitespace(node.name);
  if (typeof node.text === "string") return collapseWhitespace(node.text);
  return null;
}

function locationOf(node: Record<string, unknown>): string | null {
  const jobLocation = node.jobLocation;
  const places = Array.isArray(jobLocation) ? jobLocation : [jobLocation];
  for (const place of places) {
    const record = asRecord(place);
    const address = asRecord(record?.address) ?? record;
    if (!address) continue;
    const parts = [
      textOf(address.addressLocality),
      textOf(address.addressRegion),
      textOf(address.addressCountry),
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(", ");
  }
  return textOf(node.jobLocation) || textOf(node.applicantLocationRequirements);
}

function salaryOf(node: Record<string, unknown>): string | null {
  const salary = asRecord(node.baseSalary);
  if (!salary) return textOf(node.estimatedSalary);
  const value = asRecord(salary.value);
  const min = value?.minValue ?? salary.minValue;
  const max = value?.maxValue ?? salary.maxValue;
  const amount = value?.value ?? salary.value;
  const currency = textOf(salary.currency) ?? textOf(value?.currency);
  const bits = [min, max, amount]
    .filter((part) => typeof part === "number" || typeof part === "string")
    .map(String);
  if (bits.length === 0) return null;
  return [bits.join("–"), currency].filter(Boolean).join(" ");
}

export function readJobPostingJsonLd($: cheerio.CheerioAPI): ScrapedJobOffer | null {
  const scripts = $('script[type="application/ld+json"]')
    .toArray()
    .map((el) => $(el).contents().text())
    .filter(Boolean);

  for (const raw of scripts) {
    try {
      const parsed: unknown = JSON.parse(raw);
      const posting = flattenJsonLd(parsed).find((node) =>
        typeList(node).some((type) => type.toLowerCase() === "jobposting"),
      );
      if (!posting) continue;
      const title = textOf(posting.title);
      const company =
        textOf(asRecord(posting.hiringOrganization)?.name) ||
        textOf(posting.hiringOrganization);
      const description = textOf(posting.description);
      if (!title && !description) continue;
      return {
        title: title ? clampField(title, "title") : null,
        company: company ? clampField(company, "name") : null,
        description: description ? description.slice(0, DESCRIPTION_MAX) : null,
        location: locationOf(posting)?.slice(0, SHORT_FIELD_MAX) ?? null,
        salaryHint: salaryOf(posting)?.slice(0, SHORT_FIELD_MAX) ?? null,
      };
    } catch {
      continue;
    }
  }
  return null;
}

/** Fetch readable job posting content from a URL. */
export async function scrapeJobOfferPage(url: string): Promise<ScrapedJobOffer | null> {
  try {
    const page = await scrapePage(url, {
      onlyMainContent: true,
      timeoutMs: HTTP_TIMEOUTS.scrape,
    });
    const $ = cheerio.load(page.html);
    const jsonLd = readJobPostingJsonLd($);
    const og = readOpenGraph($);
    const body =
      (page.markdown && page.markdown.length >= 120
        ? collapseWhitespace(page.markdown)
        : "") ||
      extractMainText($, {
        selectors: DESCRIPTION_SELECTORS,
        minLength: 120,
        maxParagraphs: 10,
      });

    const title =
      jsonLd?.title ||
      (page.title ? clampField(collapseWhitespace(page.title), "title") : null) ||
      (og.title ? clampField(collapseWhitespace(og.title), "title") : null);

    if (!title && !og.description && !page.description && !body) return null;

    const location =
      jsonLd?.location ||
      metaContent($, "job:location") ||
      $("[class*='location']").first().text().trim() ||
      null;

    const salaryHint =
      jsonLd?.salaryHint ||
      $("[class*='salary'], [class*='compensation']").first().text().trim() ||
      null;

    return {
      title,
      company: jsonLd?.company ?? null,
      description: collapseWhitespace(
        jsonLd?.description || body || page.description || og.description || "",
      ).slice(0, DESCRIPTION_MAX),
      location: location ? collapseWhitespace(location).slice(0, SHORT_FIELD_MAX) : null,
      salaryHint: salaryHint
        ? collapseWhitespace(salaryHint).slice(0, SHORT_FIELD_MAX)
        : null,
    };
  } catch {
    return null;
  }
}
