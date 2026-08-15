import { fetchText, HTTP_TIMEOUTS, postJson } from "@/lib/http/fetch-text";

const FIRECRAWL_SCRAPE_URL = "https://api.firecrawl.dev/v2/scrape";

/** Reuse Firecrawl's own cache when the page was scraped this ingest window. */
const DEFAULT_MAX_AGE_MS = 3 * 60 * 60 * 1000;

export type FirecrawlFormat = "markdown" | "html" | "rawHtml" | "links";

export type ScrapeVia = "auto" | "firecrawl" | "direct";

export type ScrapePageOptions = {
  /**
   * Strip nav/footer before generating markdown. True for articles.
   * List collectors that need links / JSON-LD pass false.
   */
  onlyMainContent?: boolean;
  formats?: FirecrawlFormat[];
  timeoutMs?: number;
  /** Firecrawl `maxAge` in ms. Defaults to 3 hours. */
  maxAgeMs?: number;
  /** Skip the in-process URL cache. */
  noCache?: boolean;
  /**
   * `auto` — Firecrawl when the key is set (default).
   * `firecrawl` — must call Firecrawl (falls back only if the request fails).
   * `direct` — never spend a Firecrawl credit.
   */
  via?: ScrapeVia;
}

export type ScrapedPage = {
  url: string;
  html: string;
  markdown: string | null;
  title: string | null;
  description: string | null;
  siteName: string | null;
  source: "firecrawl" | "direct";
};

type FirecrawlData = {
  markdown?: string | null;
  html?: string | null;
  rawHtml?: string | null;
  metadata?: Record<string, unknown>;
};

type FirecrawlResponse = {
  success?: boolean;
  data?: FirecrawlData;
  markdown?: string | null;
  html?: string | null;
  rawHtml?: string | null;
  metadata?: Record<string, unknown>;
  error?: string;
};

const cache = new Map<string, ScrapedPage>();

export function hasFirecrawl(): boolean {
  return Boolean(process.env.FIRECRAWL_API_KEY?.trim());
}

export function clearScrapeCache(): void {
  cache.clear();
}

function cacheKey(url: string, opts: ScrapePageOptions): string {
  const onlyMain = opts.onlyMainContent !== false;
  const formats = (opts.formats ?? ["markdown", "rawHtml", "html"]).join(",");
  const via = opts.via ?? "auto";
  return `${url}|${onlyMain}|${formats}|${via}`;
}

function firstString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    const found = value.find((item) => typeof item === "string" && item.trim());
    return typeof found === "string" ? found.trim() : null;
  }
  return null;
}

function pickData(res: FirecrawlResponse): FirecrawlData {
  if (res.data && typeof res.data === "object") return res.data;
  return {
    markdown: res.markdown,
    html: res.html,
    rawHtml: res.rawHtml,
    metadata: res.metadata,
  };
}

function pageFromFirecrawl(url: string, data: FirecrawlData): ScrapedPage {
  const markdown = data.markdown?.trim() || null;
  const html = data.rawHtml || data.html || "";
  if (!html && !markdown) {
    throw new Error(`Firecrawl empty for ${url}`);
  }
  const meta = data.metadata ?? {};
  return {
    url,
    html: html || markdown || "",
    markdown,
    title: firstString(meta.title) || firstString(meta.ogTitle),
    description: firstString(meta.description) || firstString(meta.ogDescription),
    siteName: firstString(meta.ogSiteName) || firstString(meta.siteName),
    source: "firecrawl",
  };
}

async function scrapeWithFirecrawl(
  url: string,
  opts: ScrapePageOptions,
): Promise<ScrapedPage> {
  const key = process.env.FIRECRAWL_API_KEY?.trim();
  if (!key) throw new Error("FIRECRAWL_API_KEY missing");

  const timeoutMs = opts.timeoutMs ?? HTTP_TIMEOUTS.scrape;
  const onlyMainContent = opts.onlyMainContent ?? true;
  const formats = opts.formats ?? ["markdown", "rawHtml", "html"];

  const res = await postJson<FirecrawlResponse>(
    FIRECRAWL_SCRAPE_URL,
    {
      url,
      formats,
      onlyMainContent,
      timeout: Math.max(1_000, timeoutMs - 2_000),
      maxAge: opts.maxAgeMs ?? DEFAULT_MAX_AGE_MS,
    },
    {
      timeoutMs,
      headers: { Authorization: `Bearer ${key}` },
    },
  );

  if (res.success === false) {
    throw new Error(res.error || `Firecrawl failed for ${url}`);
  }

  return pageFromFirecrawl(url, pickData(res));
}

async function scrapeDirect(
  url: string,
  opts: ScrapePageOptions,
): Promise<ScrapedPage> {
  const html = await fetchText(url, {
    timeoutMs: opts.timeoutMs ?? HTTP_TIMEOUTS.page,
    headers: { Accept: "text/html,application/xhtml+xml" },
  });
  return {
    url,
    html,
    markdown: null,
    title: null,
    description: null,
    siteName: null,
    source: "direct",
  };
}

function wantsFirecrawl(via: ScrapeVia | undefined): boolean {
  if (via === "direct") return false;
  if (!hasFirecrawl()) return false;
  return true;
}

/**
 * Fetch a page through Firecrawl when asked to.
 * Falls back to a direct GET so local/tests still work without the key.
 */
export async function scrapePage(
  url: string,
  opts: ScrapePageOptions = {},
): Promise<ScrapedPage> {
  const key = cacheKey(url, opts);
  if (!opts.noCache) {
    const cached = cache.get(key);
    if (cached) return cached;
  }

  const page = wantsFirecrawl(opts.via)
    ? await scrapeWithFirecrawl(url, opts).catch(() => scrapeDirect(url, opts))
    : await scrapeDirect(url, opts);

  if (!opts.noCache) cache.set(key, page);
  return page;
}

/** Best-effort `scrapePage` — returns null instead of throwing. */
export async function tryScrapePage(
  url: string,
  opts: ScrapePageOptions = {},
): Promise<ScrapedPage | null> {
  try {
    return await scrapePage(url, opts);
  } catch {
    return null;
  }
}

/**
 * HTML for Cheerio collectors. Requests the full DOM (`rawHtml`) so JSON-LD
 * and link lists survive. Falls back to a direct GET without the API key.
 */
export async function fetchHtml(
  url: string,
  opts: ScrapePageOptions = {},
): Promise<string> {
  const page = await scrapePage(url, {
    onlyMainContent: false,
    formats: ["rawHtml", "html"],
    via: "direct",
    ...opts,
  });
  return page.html;
}

export async function tryFetchHtml(
  url: string,
  opts: ScrapePageOptions = {},
): Promise<string | null> {
  try {
    return await fetchHtml(url, opts);
  } catch {
    return null;
  }
}
