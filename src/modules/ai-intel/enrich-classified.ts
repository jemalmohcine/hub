import { scrapeArticlePage } from "@/modules/ai-intel/article-scrape";
import { organizeIntelLocalized } from "@/modules/ai-intel/organize-intel";
import { scrapeGithubRepo } from "@/modules/ai-intel/scrape-github-repo";
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
}

/** Full scrape + organized title/summary/essential points before DB insert. */
export async function enrichClassifiedItem(item: ClassifiedItem): Promise<ClassifiedItem> {
  const meta: Record<string, unknown> = { ...item.metadata };
  const kind = itemKind(meta);

  if (kind === "repo" && repoScrapeBudget > 0) {
    const slug = repoSlug(item, meta);
    if (slug) {
      repoScrapeBudget -= 1;
      const scraped = await scrapeGithubRepo(slug);
      if (scraped) {
        if (scraped.description) meta.description = scraped.description;
        if (scraped.readme) {
          meta.readme = scraped.readme.slice(0, 12_000);
          meta.about = scraped.readme.slice(0, 2000);
        }
        if (scraped.topics.length) meta.topics = scraped.topics;
        if (scraped.language) meta.language = scraped.language;
        if (scraped.license) meta.license = scraped.license;
        if (scraped.homepage) meta.website = scraped.homepage;
        meta.fullRepoScraped = true;
      }
    }
  }

  if (
    kind === "tool" &&
    toolScrapeBudget > 0 &&
    item.url &&
    (!meta.about || String(meta.description || "").length < 80)
  ) {
    toolScrapeBudget -= 1;
    const scraped = await scrapeArticlePage(item.url);
    if (scraped) {
      if (scraped.title) meta.scrapedTitle = scraped.title;
      if (scraped.description) meta.description = scraped.description;
      if (scraped.content) {
        meta.about = scraped.content.slice(0, 2000);
        meta.articleExcerpt = scraped.content.slice(0, 500);
      }
      meta.fullPageScraped = true;
    }
  }

  if (
    kind === "news" &&
    articleScrapeBudget > 0 &&
    item.url &&
    (!meta.about || String(item.summary).length < 160)
  ) {
    articleScrapeBudget -= 1;
    const scraped = await scrapeArticlePage(item.url);
    if (scraped) {
      if (scraped.title) meta.scrapedTitle = scraped.title;
      if (scraped.description) meta.description = scraped.description;
      if (scraped.content) {
        meta.about = scraped.content.slice(0, 2000);
        meta.articleExcerpt = scraped.content.slice(0, 500);
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
      (typeof meta.about === "string" && meta.about) ||
      (typeof meta.articleExcerpt === "string" && meta.articleExcerpt) ||
      null,
    topics: Array.isArray(meta.topics) ? (meta.topics as string[]) : [],
    language: typeof meta.language === "string" ? meta.language : null,
    locale: "fr",
  });

  const summary =
    organized.purpose ||
    organized.essentialPoints[0] ||
    item.summary;

  return {
    ...item,
    title: organized.title,
    summary: summary.slice(0, 240),
    metadata: {
      ...meta,
      rawTitle: item.title,
      displayTitle: organized.title,
      organizedTitle: organized.title,
      purpose: organized.purpose,
      essentialPoints: organized.essentialPoints,
      organizedAt: new Date().toISOString(),
      longSummary: organized.longAbout.slice(0, 1200),
      about: organized.longAbout.slice(0, 2000) || meta.about,
    },
  };
}

function readMetaString(meta: Record<string, unknown>, key: string): string | null {
  const v = meta[key];
  return typeof v === "string" && v.trim() ? v.trim() : null;
}
