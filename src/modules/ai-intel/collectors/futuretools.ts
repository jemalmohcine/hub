import * as cheerio from "cheerio";
import { absoluteUrl } from "@/lib/http/fetch-text";
import { fetchHtml } from "@/lib/scrape/firecrawl";
import type { RawHit } from "@/modules/ai-intel/types";

const SKIP_PATHS = new Set([
  "/tools",
  "/news",
  "/blog",
  "/about",
  "/faq",
  "/glossary",
  "/newsletter",
  "/newly-added",
  "/best-ai-tools",
  "/submit-a-tool",
]);

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function parseJsonLd($: ReturnType<typeof cheerio.load>): Record<string, unknown> | null {
  let software: Record<string, unknown> | null = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (software) return;
    try {
      const data = JSON.parse($(el).text()) as Record<string, unknown>;
      if (data["@type"] === "SoftwareApplication") software = data;
    } catch {
      // ignore bad json-ld
    }
  });
  return software;
}

function extractGlance($: ReturnType<typeof cheerio.load>): Record<string, string> {
  const glance: Record<string, string> = {};
  $("aside dl > div, section dl > div").each((_, el) => {
    const key = cleanText($(el).find("dt").first().text()).toLowerCase();
    const value = cleanText($(el).find("dd").first().text());
    if (key && value) glance[key] = value;
  });

  // Stats row: Upvotes / Pricing / Category / In the database since
  $("p.text-\\[10px\\], p").each((_, el) => {
    const label = cleanText($(el).text()).toLowerCase();
    const value = cleanText($(el).next("p").text());
    if (!value) return;
    if (label === "upvotes") glance.upvotes = value;
    if (label === "pricing") glance.pricing = value;
    if (label === "category") glance.category = value;
    if (label.includes("database since") || label === "listed") {
      glance.listed = value;
    }
  });

  return glance;
}

async function enrichToolPage(
  sourceId: string,
  toolUrl: string,
): Promise<RawHit | null> {
  const html = await fetchHtml(toolUrl);
  const $ = cheerio.load(html);
  const jsonLd = parseJsonLd($);

  const title =
    cleanText($("h1").first().text()) ||
    (typeof jsonLd?.name === "string" ? jsonLd.name : "") ||
    cleanText($('meta[property="og:title"]').attr("content") ?? "").replace(
      /^Future Tools\s*-\s*/i,
      "",
    );

  if (!title || title.length < 2) return null;

  const tagline =
    cleanText($("h1").first().parent().find("p").first().text()) ||
    cleanText($('meta[name="description"]').attr("content") ?? "") ||
    (typeof jsonLd?.description === "string" ? jsonLd.description : "");

  const about = cleanText($(".article-body").text()) || tagline;
  const tags = $(
    'a[href*="/tools?categories="], a[href*="categories="]',
  )
    .map((_, el) => cleanText($(el).text()))
    .get()
    .filter((t, i, arr) => t.length > 1 && arr.indexOf(t) === i)
    .slice(0, 8);

  const glance = extractGlance($);
  const website =
    (typeof jsonLd?.url === "string" ? jsonLd.url : "") ||
    cleanText(
      $("aside p.text-center, .truncate")
        .filter((_, el) => /\./.test($(el).text()) && !/upvote/i.test($(el).text()))
        .first()
        .text(),
    );

  const image =
    $('meta[property="og:image"]').attr("content") ||
    $("h1").closest("section").find("img").first().attr("src") ||
    "";

  const mattsPick =
    $("body").text().includes("Matt's Pick") ||
    $("body").text().includes("Matt’s Pick");

  const pricing =
    glance.pricing ||
    cleanText(
      $("span")
        .filter((_, el) => /^(Free|Paid|Freemium)$/i.test(cleanText($(el).text())))
        .first()
        .text(),
    );

  const upvotes =
    glance.upvotes ||
    cleanText(
      $('button[aria-label*="Upvote"] span')
        .filter((_, el) => /^\d+$/.test(cleanText($(el).text())))
        .first()
        .text(),
    );

  const summaryParts = [
    tagline,
    pricing ? `Prix: ${pricing}` : "",
    upvotes ? `${upvotes} upvotes` : "",
    tags.length ? `Tags: ${tags.join(", ")}` : "",
  ].filter(Boolean);

  return {
    title,
    summary: summaryParts.join(" · ").slice(0, 500),
    url: toolUrl,
    sourceId,
    externalId: toolUrl,
    publishedAt: new Date().toISOString(),
    raw: {
      provider: "futuretools",
      kind: "tool",
      tagline,
      about: about.slice(0, 2000),
      tags,
      pricing: pricing || null,
      upvotes: upvotes ? Number(upvotes) || upvotes : null,
      website: website || null,
      listed: glance.listed || glance["in the database since"] || null,
      api: glance.api || null,
      openSource: glance["open source"] || null,
      mattsPick,
      image: image || null,
      categoryLabel: glance.category || tags[0] || null,
    },
  };
}

async function collectNewsCards(
  sourceId: string,
  homeHtml: string,
  baseUrl: string,
): Promise<RawHit[]> {
  const $ = cheerio.load(homeHtml);
  const hits: RawHit[] = [];

  $("a[href]").each((_, el) => {
    if (hits.length >= 12) return;
    const href = $(el).attr("href") ?? "";
    const abs = absoluteUrl(baseUrl, href);
    // Prefer editorial cards that point outside or /news/
    const isNewsPath = /futuretools\.io\/news\//i.test(abs);
    const isExternalNews =
      /^https?:\/\//i.test(abs) &&
      !/futuretools\.io/i.test(abs) &&
      /utm_source=futuretools/i.test(abs);

    if (!isNewsPath && !isExternalNews) return;

    const title = cleanText($(el).find("h2, h3").first().text()) ||
      cleanText($(el).text());
    if (title.length < 20 || title.length > 180) return;
    if (/^\d+-/.test(title)) return; // ranked tool list junk
    if (hits.some((h) => h.url === abs || h.title === title)) return;

    const card = $(el).closest("article, li, div");
    const summary = cleanText(card.find("p").first().text()).slice(0, 400);

    hits.push({
      title,
      summary,
      url: abs,
      sourceId,
      externalId: abs,
      publishedAt: new Date().toISOString(),
      raw: {
        provider: "futuretools",
        kind: "news",
        about: summary,
      },
    });
  });

  return hits;
}

async function discoverToolUrls(baseUrl: string): Promise<string[]> {
  const pages = [
    baseUrl,
    absoluteUrl(baseUrl, "/newly-added"),
    absoluteUrl(baseUrl, "/best-ai-tools"),
    absoluteUrl(baseUrl, "/tools"),
  ];

  const urls = new Set<string>();

  for (const page of pages) {
    try {
      const html = await fetchHtml(page);
      const $ = cheerio.load(html);
      $("a[href*='/tools/']").each((_, el) => {
        const abs = absoluteUrl(page, $(el).attr("href") ?? "");
        try {
          const u = new URL(abs);
          if (!/futuretools\.io$/i.test(u.hostname.replace(/^www\./, ""))) {
            return;
          }
          const path = u.pathname.replace(/\/$/, "");
          if (!path.startsWith("/tools/")) return;
          if (SKIP_PATHS.has(path)) return;
          if (path.split("/").length < 3) return;
          urls.add(`${u.origin}${path}`);
        } catch {
          // ignore
        }
      });
    } catch {
      // page failed — continue
    }
  }

  return [...urls];
}

export async function collectFutureTools(
  sourceId: string,
  url: string,
): Promise<RawHit[]> {
  const homeHtml = await fetchHtml(url);
  const toolUrls = await discoverToolUrls(url);
  const limited = toolUrls.slice(0, 22);

  const toolHits: RawHit[] = [];
  // Enrich in small batches to avoid hammering the site
  for (let i = 0; i < limited.length; i += 4) {
    const batch = limited.slice(i, i + 4);
    const enriched = await Promise.all(
      batch.map(async (toolUrl) => {
        try {
          return await enrichToolPage(sourceId, toolUrl);
        } catch {
          return null;
        }
      }),
    );
    for (const hit of enriched) {
      if (hit) toolHits.push(hit);
    }
  }

  const newsHits = await collectNewsCards(sourceId, homeHtml, url);

  // Prefer rich tool pages; keep a few news items
  return [...toolHits, ...newsHits.slice(0, 10)];
}
