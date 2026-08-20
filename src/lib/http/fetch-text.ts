/** Shared outbound HTTP for every collector and scraper (ai-intel, job-board, …). */

export const HTTP_TIMEOUTS = {
  /** Feeds and JSON APIs — fail fast, the nightly job has many of them. */
  api: 12_000,
  /** Full HTML pages we parse afterwards. */
  page: 14_000,
  /** Slow third parties we still want to wait for. */
  slow: 20_000,
  /** Firecrawl scrape — the remote browser can take a while. */
  scrape: 45_000,
} as const;

const USER_AGENT = "DevHub/1.0 (+https://github.com/devhub; nightly digest)";

const DEFAULT_ACCEPT =
  "text/html,application/xhtml+xml,application/xml,application/json,*/*";

export type FetchTextOptions = {
  timeoutMs?: number;
  headers?: Record<string, string>;
};

export async function fetchText(
  url: string,
  opts: FetchTextOptions = {},
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    opts.timeoutMs ?? HTTP_TIMEOUTS.api,
  );
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: DEFAULT_ACCEPT,
        ...opts.headers,
      },
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchJson<T>(
  url: string,
  opts: FetchTextOptions = {},
): Promise<T> {
  const text = await fetchText(url, opts);
  return JSON.parse(text) as T;
}

/** POST JSON and parse the JSON response. Used by Firecrawl (and similar APIs). */
export async function postJson<T>(
  url: string,
  body: unknown,
  opts: FetchTextOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    opts.timeoutMs ?? HTTP_TIMEOUTS.api,
  );
  try {
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
        "Content-Type": "application/json",
        ...opts.headers,
      },
      body: JSON.stringify(body),
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      const snippet = (await res.text().catch(() => "")).trim().slice(0, 240);
      throw new Error(
        snippet
          ? `HTTP ${res.status} for ${url}: ${snippet}`
          : `HTTP ${res.status} for ${url}`,
      );
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** fetchText that resolves to null instead of throwing — for best-effort scrapes. */
export async function tryFetchText(
  url: string,
  opts: FetchTextOptions = {},
): Promise<string | null> {
  try {
    return await fetchText(url, opts);
  } catch {
    return null;
  }
}

export function decodeXmlEntities(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .trim();
}

export function absoluteUrl(base: string, href: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}
