import * as cheerio from "cheerio";
import { fetchText } from "@/modules/ai-intel/collectors/fetch";
import { decodeHtmlEntities, sanitizePlainText } from "@/modules/ai-intel/html-to-text";

export type ScrapedArticle = {
  title: string | null;
  description: string | null;
  content: string | null;
  siteName: string | null;
};

function cleanText(raw: string): string {
  return sanitizePlainText(
    decodeHtmlEntities(raw)
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
      .replace(/<(script|style|nav|footer|header|aside)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|li|h[1-6]|div|section|article)>/gi, "\n"),
    4000,
  );
}

function metaContent($: cheerio.CheerioAPI, key: string): string | null {
  const value =
    $(`meta[property="${key}"]`).attr("content") ||
    $(`meta[name="${key}"]`).attr("content");
  return value?.trim() || null;
}

/** Fetch and extract readable article content from a URL. */
export async function scrapeArticlePage(url: string): Promise<ScrapedArticle | null> {
  try {
    const html = await fetchText(url, {
      timeoutMs: 12_000,
      headers: { Accept: "text/html,application/xhtml+xml" },
    });
    const $ = cheerio.load(html);

    const title =
      metaContent($, "og:title") ||
      $("title").first().text().trim() ||
      $("h1").first().text().trim() ||
      null;

    const description =
      metaContent($, "og:description") ||
      metaContent($, "description") ||
      null;

    const siteName = metaContent($, "og:site_name");

    const contentSelectors = [
      "article",
      "main article",
      "[role='main']",
      "main",
      ".post-content",
      ".article-content",
      ".entry-content",
      "#content",
    ];

    let content = "";
    for (const selector of contentSelectors) {
      const block = $(selector).first();
      if (block.length === 0) continue;
      const text = cleanText(block.text());
      if (text.length >= 200) {
        content = text;
        break;
      }
    }

    if (!content) {
      const paragraphs = $("p")
        .toArray()
        .map((el) => cleanText($(el).text()))
        .filter((p) => p.length >= 40);
      content = paragraphs.slice(0, 8).join("\n\n");
    }

    if (!title && !description && !content) return null;

    return {
      title: title ? cleanText(title).slice(0, 240) : null,
      description: description ? cleanText(description).slice(0, 500) : null,
      content: content ? content.slice(0, 4000) : null,
      siteName: siteName ? cleanText(siteName).slice(0, 80) : null,
    };
  } catch {
    return null;
  }
}
