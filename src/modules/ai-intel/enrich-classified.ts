import { scrapeArticlePage, resetFirecrawlArticleBudget } from "@/modules/ai-intel/article-scrape";
import { detectHardSignal, hardSignalScoreFloor } from "@/modules/ai-intel/hard-signals";
import { sanitizePlainText } from "@/modules/ai-intel/html-to-text";
import { isNearDuplicate } from "@/lib/text";
import type { LlmContentKind } from "@/modules/ai-intel/llm-organize";
import {
  isLlmOrganizeAvailable,
  resetLlmOrganizeBudget,
} from "@/modules/ai-intel/llm-organize";
import { organizeIntelLocalized } from "@/modules/ai-intel/organize-intel";
import { isRepoExploding } from "@/modules/ai-intel/repo-momentum";
import { scrapeGithubRepo } from "@/modules/ai-intel/scrape-github-repo";
import { attachScoreToRaw, isOffTopic, verdictFromScore } from "@/modules/ai-intel/score";
import type { AiCategory, AiPillar, AiUrgency, ClassifiedItem } from "@/modules/ai-intel/types";

const MAX_ARTICLE_SCRAPES = Number(process.env.AI_INTEL_ARTICLE_SCRAPES || 60);
const MAX_REPO_SCRAPES = Number(process.env.AI_INTEL_REPO_SCRAPES || 40);
const MAX_TOOL_SCRAPES = Number(process.env.AI_INTEL_TOOL_SCRAPES || 30);

const EXPLODING_REPO_SCORE_FLOOR = 78;
const OFF_TOPIC_SCORE_CEILING = 40;

function itemKind(meta: Record<string, unknown>): "repo" | "tool" | "news" {
  if (meta.kind === "repo") return "repo";
  if (meta.kind === "tool") return "tool";
  return "news";
}

function repoSlug(item: ClassifiedItem): string | null {
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
  resetFirecrawlArticleBudget();
}

/** A title this long is a paragraph the pipeline failed to summarise. */
const MAX_STORED_TITLE = 110;

function needsReorganize(meta: Record<string, unknown>): boolean {
  const points = meta.essentialPoints;
  if (!Array.isArray(points) || points.length === 0) return true;

  // Leftover markup from an early scraping pass.
  if (
    points.some(
      (p) =>
        typeof p === "string" && (/<[a-z]/i.test(p) || /&lt;|align\s*=/i.test(p)),
    )
  ) {
    return true;
  }

  // The heuristic path copies `purpose` into the first bullet, which is what
  // made the detail view print the same sentence three times.
  const purpose = typeof meta.purpose === "string" ? meta.purpose : "";
  const first = typeof points[0] === "string" ? points[0] : "";
  if (purpose && first && isNearDuplicate(first, purpose)) return true;

  const title = typeof meta.organizedTitle === "string" ? meta.organizedTitle : "";
  if (title.length > MAX_STORED_TITLE) return true;

  // Rows organised before an LLM key was configured deserve a real analysis.
  return meta.organizedBy !== "llm" && isLlmOrganizeAvailable();
}

/** Re-organize from stored readme/about without hitting scrape budgets. */
export async function reorganizeClassifiedItem(
  item: ClassifiedItem,
): Promise<ClassifiedItem> {
  return enrichClassifiedItem(item, { skipScrape: true });
}

/** Pillar implied by what the content turned out to be. */
function pillarFromContentKind(
  kind: LlmContentKind,
  current: AiPillar,
): AiPillar {
  if (kind === "repo") return "opensource";
  if (kind === "tool" || kind === "feature") return "tools";
  if (kind === "model") return "models";
  if (kind === "policy") return "world";
  return current;
}

/** Category implied by what the content turned out to be, for feed filters. */
function categoryFromContentKind(
  kind: LlmContentKind,
  current: AiCategory,
): AiCategory {
  if (kind === "security") return "security";
  if (kind === "pricing") return "pricing";
  if (kind === "breaking") return "deprecation";
  if (kind === "model") {
    return current === "capacity" || current === "upgrade" ? current : "new_model";
  }
  if (kind === "feature") return "upgrade";
  return current;
}

/**
 * Scrape everything available, let the LLM decide what it is and how urgent it
 * is, then clamp that decision with deterministic guardrails.
 */
export async function enrichClassifiedItem(
  item: ClassifiedItem,
  opts: { skipScrape?: boolean } = {},
): Promise<ClassifiedItem> {
  const meta: Record<string, unknown> = { ...item.metadata };
  const kind = itemKind(meta);
  const skipScrape = opts.skipScrape === true;

  if (!skipScrape && kind === "repo" && repoScrapeBudget > 0) {
    const slug = repoSlug(item);
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

  if (!skipScrape && kind === "tool" && toolScrapeBudget > 0 && item.url) {
    toolScrapeBudget -= 1;
    const scraped = await scrapeArticlePage(item.url);
    if (scraped) {
      if (scraped.title) meta.scrapedTitle = sanitizePlainText(scraped.title, 200);
      if (scraped.description) {
        meta.description = sanitizePlainText(scraped.description, 500);
      }
      if (scraped.content) {
        meta.articleBody = scraped.content.slice(0, 12_000);
        meta.articleExcerpt = sanitizePlainText(scraped.content, 500);
      }
      meta.fullPageScraped = true;
      meta.scrapedVia = scraped.scrapedVia;
    }
  }

  if (!skipScrape && kind === "news" && articleScrapeBudget > 0 && item.url) {
    articleScrapeBudget -= 1;
    const scraped = await scrapeArticlePage(item.url);
    if (scraped) {
      if (scraped.title) meta.scrapedTitle = sanitizePlainText(scraped.title, 200);
      if (scraped.description) {
        meta.description = sanitizePlainText(scraped.description, 500);
      }
      if (scraped.content) {
        meta.articleBody = scraped.content.slice(0, 12_000);
        meta.articleExcerpt = sanitizePlainText(scraped.content, 500);
      }
      if (scraped.siteName) meta.siteName = scraped.siteName;
      meta.fullPageScraped = true;
      meta.scrapedVia = scraped.scrapedVia;
    }
  }

  const organized = await organizeIntelLocalized({
    kind,
    name:
      kind === "repo"
        ? repoSlug(item) || item.title
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
    url: item.url,
    source: item.primarySource,
    publishedAt: item.publishedAt,
  });

  const decision = organized.decision ?? null;

  const summary =
    organized.purpose ||
    organized.essentialPoints[0] ||
    sanitizePlainText(item.summary, 240);

  // Heuristic pass stays as the fallback and keeps its human-readable labels.
  const rescored = attachScoreToRaw(kind, meta, {
    title: organized.title,
    summary,
    urgency: item.urgency,
  });

  // The guardrails read the full scraped body, not just the RSS headline.
  const fullText = [
    item.title,
    item.summary,
    readMetaString(meta, "description"),
    readMetaString(meta, "articleBody") || readMetaString(meta, "articleExcerpt"),
    readMetaString(meta, "readme"),
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 20_000);

  const hardSignal = kind === "repo" ? null : detectHardSignal(fullText);
  const exploding = kind === "repo" && isRepoExploding({ metadata: meta });
  const offTopic = isOffTopic(fullText.slice(0, 4000));

  let score = decision ? decision.score : Number(rescored.score) || 0;
  score = Math.max(score, hardSignalScoreFloor(hardSignal));
  if (exploding) score = Math.max(score, EXPLODING_REPO_SCORE_FLOOR);
  if (offTopic && !hardSignal) score = Math.min(score, OFF_TOPIC_SCORE_CEILING);
  score = Math.max(0, Math.min(100, Math.round(score)));

  let urgency: AiUrgency = decision
    ? decision.urgency
    : (rescored.verdict === "use_it" ? "medium" : "light");

  if (hardSignal) urgency = "urgent";
  if (kind === "repo") {
    // A repo never forces an action — only a real explosion earns an alert.
    urgency = exploding ? "urgent" : urgency === "urgent" ? "medium" : urgency;
  }
  if (offTopic && !hardSignal) urgency = "light";

  const actionRequired =
    Boolean(hardSignal) || (decision?.actionRequired === true && !offTopic);

  const contentKind: LlmContentKind | null = hardSignal
    ? (hardSignal === "outage" ? "news" : hardSignal)
    : exploding
      ? "repo"
      : (decision?.contentKind ?? null);

  const pillar = contentKind
    ? pillarFromContentKind(contentKind, item.pillar)
    : item.pillar;
  const category = contentKind
    ? categoryFromContentKind(contentKind, item.category)
    : item.category;

  const verdict = verdictFromScore(score);

  return {
    ...item,
    pillar,
    category,
    title: organized.title,
    summary: summary.slice(0, 240),
    urgency,
    metadata: {
      ...meta,
      ...rescored,
      score,
      verdict,
      beneficial: verdict === "use_it",
      rawTitle: item.title,
      displayTitle: organized.title,
      organizedTitle: organized.title,
      purpose: organized.purpose,
      essentialPoints: organized.essentialPoints,
      organizedAt: new Date().toISOString(),
      organizedBy: organized.organizedBy ?? "heuristic",
      llmModel: organized.llmModel ?? null,
      contentKind,
      hardSignal,
      actionRequired,
      exploding,
      tags: decision?.tags ?? [],
      impact: decision?.impact ?? null,
      scoreReason: decision?.scoreReason ?? null,
      longSummary: organized.longAbout.slice(0, 1600),
      about: organized.longAbout.slice(0, 2400),
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
