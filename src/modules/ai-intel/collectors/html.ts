import * as cheerio from "cheerio";
import {
  absoluteUrl,
  fetchText,
} from "@/modules/ai-intel/collectors/fetch";
import type { RawHit } from "@/modules/ai-intel/types";

export async function collectGitTrend(
  sourceId: string,
  url: string,
): Promise<RawHit[]> {
  const html = await fetchText(url);
  const $ = cheerio.load(html);
  const hits: RawHit[] = [];

  $("a[href*='github.com/']").each((_, el) => {
    if (hits.length >= 30) return;
    const href = $(el).attr("href");
    if (!href) return;
    const abs = absoluteUrl(url, href);
    const m = abs.match(/github\.com\/([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)/);
    if (!m) return;
    const repo = m[1];
    if (hits.some((h) => h.externalId === repo)) return;
    const title =
      $(el).text().trim() ||
      repo;
    const card = $(el).closest("article, li, div");
    const summary = card
      .text()
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 280);
    hits.push({
      title: title.includes("/") ? title : repo,
      summary: summary || `Trending on GitTrend: ${repo}`,
      url: `https://github.com/${repo}`,
      sourceId,
      externalId: repo,
      publishedAt: new Date().toISOString(),
      raw: { provider: "gittrend" },
    });
  });

  return hits;
}

export async function collectFutureTools(
  sourceId: string,
  url: string,
): Promise<RawHit[]> {
  const html = await fetchText(url);
  const $ = cheerio.load(html);
  const hits: RawHit[] = [];

  $("a[href]").each((_, el) => {
    if (hits.length >= 40) return;
    const href = $(el).attr("href") ?? "";
    const abs = absoluteUrl(url, href);
    if (!/futuretools\.io\/(ai-news|news|tools|blog)\//i.test(abs) &&
        !/futuretools\.io\/.+/.test(abs)) {
      return;
    }
    // Prefer article-like paths
    if (
      abs === url ||
      abs.endsWith("/ai-news") ||
      abs.endsWith("/tools") ||
      /\/(about|faq|glossary|subscribe|newsletter)/i.test(abs)
    ) {
      return;
    }
    const title = $(el).text().replace(/\s+/g, " ").trim();
    if (title.length < 18 || title.length > 200) return;
    if (hits.some((h) => h.url === abs)) return;

    const parent = $(el).closest("article, li, div");
    const summary = parent
      .text()
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 320);

    hits.push({
      title,
      summary: summary === title ? "" : summary,
      url: abs,
      sourceId,
      externalId: abs,
      publishedAt: new Date().toISOString(),
      raw: { provider: "futuretools" },
    });
  });

  return hits;
}

export async function collectGithubTrending(
  sourceId: string,
  url: string,
): Promise<RawHit[]> {
  const html = await fetchText(url, {
    headers: { Accept: "text/html" },
  });
  const $ = cheerio.load(html);
  const hits: RawHit[] = [];

  $("article.Box-row").each((_, el) => {
    if (hits.length >= 25) return;
    const link = $(el).find("h2 a").first();
    const href = link.attr("href");
    if (!href) return;
    const repo = href.replace(/^\//, "");
    const desc = $(el).find("p").first().text().replace(/\s+/g, " ").trim();
    hits.push({
      title: repo,
      summary: desc || `Trending on GitHub: ${repo}`,
      url: `https://github.com/${repo}`,
      sourceId,
      externalId: repo,
      publishedAt: new Date().toISOString(),
      raw: { provider: "github-trending" },
    });
  });

  // Fallback if markup changed
  if (hits.length === 0) {
    $("a[href^='/'][data-hydro-click], h2 a[href^='/']").each((_, el) => {
      if (hits.length >= 25) return;
      const href = $(el).attr("href") ?? "";
      if (!/^\/[^/]+\/[^/]+\/?$/.test(href)) return;
      const repo = href.replace(/^\//, "").replace(/\/$/, "");
      if (hits.some((h) => h.externalId === repo)) return;
      hits.push({
        title: repo,
        summary: `Trending on GitHub: ${repo}`,
        url: `https://github.com/${repo}`,
        sourceId,
        externalId: repo,
        publishedAt: new Date().toISOString(),
      });
    });
  }

  return hits;
}

export async function collectGenericHtmlList(
  sourceId: string,
  url: string,
): Promise<RawHit[]> {
  const html = await fetchText(url);
  const $ = cheerio.load(html);
  const hits: RawHit[] = [];

  $("article a[href], h2 a[href], h3 a[href], li a[href]").each((_, el) => {
    if (hits.length >= 30) return;
    const href = $(el).attr("href");
    if (!href || href.startsWith("#")) return;
    const abs = absoluteUrl(url, href);
    const title = $(el).text().replace(/\s+/g, " ").trim();
    if (title.length < 12 || title.length > 180) return;
    if (hits.some((h) => h.url === abs)) return;
    hits.push({
      title,
      summary: "",
      url: abs,
      sourceId,
      externalId: abs,
      publishedAt: new Date().toISOString(),
    });
  });

  return hits;
}
