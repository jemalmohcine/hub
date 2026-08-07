import { scrapeArticlePage } from "@/modules/ai-intel/article-scrape";
import { urgencyFromScore } from "@/modules/ai-intel/classify";
import { sanitizePlainText } from "@/modules/ai-intel/html-to-text";
import { resetLlmOrganizeBudget } from "@/modules/ai-intel/llm-organize";
import { organizeIntelLocalized } from "@/modules/ai-intel/organize-intel";
import { scrapeGithubRepo } from "@/modules/ai-intel/scrape-github-repo";
import { attachScoreToRaw } from "@/modules/ai-intel/score";
import type { ClassifiedItem } from "@/modules/ai-intel/types";

const MAX_ARTICLE_SCRAPES = 18;
const MAX_REPO_SCRAPES = 22;
const MAX_TOOL_SCRAPES = 12;

function itemKind(meta: Record<string, unknown>): "repo" | "tool" | "news" {
  if (meta.kind === "repo") return "repo";
  if (meta.kind === "tool") return "tool";
  return "news";
}

function repoSlug(item: ClassifiedItem, meta: Record<string, unknown>): string | null {
  const fromTitle = item.title.trim();
  if (/^[^/]+\/[^/]+$/.test(fromTitle)) return fromTitle;
  const url = item.url || "";
  const match = url.match(/github\.com\/([^/]+\/[^/#?]+)/i);
  return match?.[1]?.replace(/\.git$/, "") ?? null;
}

let articleScrapeBudget = MAX_ARTICLE_SCRAPES;
let repoScrapeBudget = MAX_REPO_SCRAPES;
let toolScrapeBudget = MAX_TOOL_SCRAPES;

export function resetArticleScrapeBudget() {
  articleScrapeBudget = MAX_ARTICLE_SCRAPES;
  repoScrapeBudget = MAX_REPO_SCRAPES;
  toolScrapeBudget = MAX_TOOL_SCRAPES;
  resetLlmOrganizeBudget();
}

function needsReorganize(meta: Record<string, unknown>): boolean {
  const points = meta.essentialPoints;
  if (!Array.isArray(points) || points.length === 0) return true;
  return points.some(
    (p) =>
      typeof p === "string" &&
      (/<[a-z]/i.test(p) || /&lt;|align\s*=/i.test(p)),
  );
}

/** Re-organize from stored readme/about without hitting scrape budgets. */
export async function reorganizeClassifiedItem(
  item: ClassifiedItem,
): Promise<ClassifiedItem> {
  return enrichClassifiedItem(item, { skipScrape: true });
}

/** Full scrape + organized title/summary/essential points before DB insert. */
export async function enrichClassifiedItem(
  item: ClassifiedItem,
  opts: { skipScrape?: boolean } = {},
): Promise<ClassifiedItem> {
  const meta: Record<string, unknown> = { ...item.metadata };
  const kind = itemKind(meta);
  const skipScrape = opts.skipScrape === true;

  if (!skipScrape && kind === "repo" && repoScrapeBudget > 0) {
    const slug = repoSlug(item, meta);
    if (slug) {
      repoScrapeBudget -= 1;
      const scraped = await scrapeGithubRepo(slug);
      if (scraped) {
        if (scraped.description) {
          meta.description = sanitizePlainText(scraped.description, 500);
        }
        if (scraped.readme) {
          meta.readme = scraped.readme.slice(0, 12_000);
        }
        if (scraped.topics.length) meta.topics = scraped.topics;
        if (scraped.language) meta.language = scraped.language;
        if (scraped.license) meta.license = scraped.license;
        if (scraped.homepage) meta.website = scraped.homepage;
        if (scraped.stars) meta.stars = scraped.stars;
        if (scraped.forks) meta.forks = scraped.forks;
        meta.fullRepoScraped = true;
      }
    }
  }

  if (
    !skipScrape &&
    kind === "tool" &&
    toolScrapeBudget > 0 &&
    item.url &&
    (!meta.readme || String(meta.description || "").length < 80)
  ) {
    toolScrapeBudget -= 1;
    const scraped = await scrapeArticlePage(item.url);
    if (scraped) {
      if (scraped.title) meta.scrapedTitle = sanitizePlainText(scraped.title, 200);
      if (scraped.description) {
        meta.description = sanitizePlainText(scraped.description, 500);
      }
      if (scraped.content) {
        meta.articleBody = scraped.content.slice(0, 4000);
        meta.articleExcerpt = sanitizePlainText(scraped.content, 500);
      }
      meta.fullPageScraped = true;
    }
  }

  if (
    !skipScrape &&
    kind === "news" &&
    articleScrapeBudget > 0 &&
    item.url &&
    (!meta.articleBody || String(item.summary).length < 160)
  ) {
    articleScrapeBudget -= 1;
    const scraped = await scrapeArticlePage(item.url);
    if (scraped) {
      if (scraped.title) meta.scrapedTitle = sanitizePlainText(scraped.title, 200);
      if (scraped.description) {
        meta.description = sanitizePlainText(scraped.description, 500);
      }
      if (scraped.content) {
        meta.articleBody = scraped.content.slice(0, 4000);
        meta.articleExcerpt = sanitizePlainText(scraped.content, 500);
      }
      if (scraped.siteName) meta.siteName = scraped.siteName;
      meta.fullPageScraped = true;
    }
  }

  const organized = await organizeIntelLocalized({
    kind,
    name:
      kind === "repo"
        ? repoSlug(item, meta) || item.title
        : (typeof meta.scrapedTitle === "string" && meta.scrapedTitle) || item.title,
    description:
      (typeof meta.description === "string" && meta.description) ||
      readMetaString(meta, "tagline") ||
      item.summary,
    readme: typeof meta.readme === "string" ? meta.readme : null,
    articleBody:
      (typeof meta.articleBody === "string" && meta.articleBody) ||
      (typeof meta.articleExcerpt === "string" && meta.articleExcerpt) ||
      (typeof meta.about === "string" && meta.about) ||
      null,
    topics: Array.isArray(meta.topics) ? (meta.topics as string[]) : [],
    language: typeof meta.language === "string" ? meta.language : null,
    locale: "fr",
    metrics: buildMetricsLine(meta),
  });

  const summary =
    organized.purpose ||
    organized.essentialPoints[0] ||
    sanitizePlainText(item.summary, 240);

  const rescored = attachScoreToRaw(kind, meta, {
    title: organized.title,
    summary,
    urgency: item.urgency,
  });

  const urgency = urgencyFromScore({
    base: item.urgency,
    verdict: String(rescored.verdict ?? "skip"),
    score: Number(rescored.score) || 0,
    category: item.category,
    kind,
    starsToday: Number(meta.starsToday) || 0,
  });

  return {
    ...item,
    title: organized.title,
    summary: summary.slice(0, 240),
    urgency,
    metadata: {
      ...meta,
      ...rescored,
      rawTitle: item.title,
      displayTitle: organized.title,
      organizedTitle: organized.title,
      purpose: organized.purpose,
      essentialPoints: organized.essentialPoints,
      organizedAt: new Date().toISOString(),
      organizedBy: organized.organizedBy ?? "heuristic",
      llmModel: organized.llmModel ?? null,
      longSummary: organized.longAbout.slice(0, 1200),
      about: organized.longAbout.slice(0, 1800),
      // Never keep raw readme HTML in about — readme stays in meta.readme for re-runs
    },
  };
}

export function itemNeedsContentRefresh(meta: Record<string, unknown>): boolean {
  return needsReorganize(meta);
}

function readMetaString(meta: Record<string, unknown>, key: string): string | null {
  const v = meta[key];
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function buildMetricsLine(meta: Record<string, unknown>): string | null {
  const parts: string[] = [];
  const stars = Number(meta.stars);
  const starsToday = Number(meta.starsToday);
  const forks = Number(meta.forks);
  if (stars > 0) parts.push(`${stars} stars`);
  if (starsToday > 0) parts.push(`+${starsToday} stars today`);
  if (forks > 0) parts.push(`${forks} forks`);
  if (typeof meta.language === "string") parts.push(meta.language);
  if (typeof meta.pricing === "string") parts.push(meta.pricing);
  return parts.length ? parts.join(" · ") : null;
}
