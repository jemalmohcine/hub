import { scrapeArticlePage } from "@/modules/ai-intel/article-scrape";
import { explainTitle } from "@/modules/ai-intel/brief";
import type { ClassifiedItem } from "@/modules/ai-intel/types";

const MAX_ARTICLE_SCRAPES = 18;

function firstClause(text: string, max = 180): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const clause = clean.split(/[.!?\n|·]/)[0]?.trim() || clean;
  if (clause.length <= max) return clause;
  return `${clause.slice(0, max - 1).trim()}…`;
}

function itemKind(meta: Record<string, unknown>): "repo" | "tool" | "news" {
  if (meta.kind === "repo") return "repo";
  if (meta.kind === "tool") return "tool";
  return "news";
}

function organizeSummary(
  item: ClassifiedItem,
  meta: Record<string, unknown>,
  displayTitle: string,
): string {
  const about =
    (typeof meta.about === "string" && meta.about) ||
    (typeof meta.articleExcerpt === "string" && meta.articleExcerpt) ||
    (typeof meta.description === "string" && meta.description) ||
    item.summary;

  const clause = firstClause(String(about), 200);
  if (clause && clause.toLowerCase() !== displayTitle.toLowerCase()) {
    return clause;
  }
  return item.summary || displayTitle;
}

let articleScrapeBudget = MAX_ARTICLE_SCRAPES;

export function resetArticleScrapeBudget() {
  articleScrapeBudget = MAX_ARTICLE_SCRAPES;
}

/** Full-page scrape + human title/summary before DB insert. */
export async function enrichClassifiedItem(item: ClassifiedItem): Promise<ClassifiedItem> {
  const meta: Record<string, unknown> = { ...item.metadata };
  const kind = itemKind(meta);

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
        meta.about = scraped.content.slice(0, 1600);
        meta.articleExcerpt = scraped.content.slice(0, 420);
      }
      if (scraped.siteName) meta.siteName = scraped.siteName;
      meta.fullPageScraped = true;
    }
  }

  const draft = {
    title:
      (typeof meta.scrapedTitle === "string" && meta.scrapedTitle) || item.title,
    summary: organizeSummary(item, meta, item.title),
    urgency: item.urgency,
    metadata: meta,
    pillar: item.pillar,
    category: item.category,
    primary_source: item.primarySource,
  };

  const explained = explainTitle(draft, "fr");
  const summary = organizeSummary(item, meta, explained.title);

  return {
    ...item,
    title: explained.title,
    summary: summary.slice(0, 240),
    metadata: {
      ...meta,
      rawTitle: item.title,
      displayTitle: explained.title,
      organizedAt: new Date().toISOString(),
      longSummary:
        (typeof meta.about === "string" && meta.about.slice(0, 900)) ||
        item.metadata.longSummary,
    },
  };
}
