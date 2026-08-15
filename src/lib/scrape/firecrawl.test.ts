import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearScrapeCache,
  fetchHtml,
  scrapePage,
} from "@/lib/scrape/firecrawl";

type FetchInit = { method?: string };

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 500) {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

function htmlResponse(html: string) {
  return {
    ok: true,
    status: 200,
    json: async () => {
      throw new Error("not json");
    },
    text: async () => html,
  };
}

describe("scrapePage", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    clearScrapeCache();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("FIRECRAWL_API_KEY", "fc-test");
  });

  afterEach(() => {
    clearScrapeCache();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("parses a v2 Firecrawl payload (data wrapper)", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: {
          markdown: "# Hello",
          html: "<article>cleaned</article>",
          rawHtml: "<html><script type='application/ld+json'>{}</script></html>",
          metadata: {
            title: "Hello page",
            description: "A page",
            ogSiteName: "Example",
          },
        },
      }),
    );

    const page = await scrapePage("https://example.com/post");

    expect(page.source).toBe("firecrawl");
    expect(page.markdown).toBe("# Hello");
    expect(page.html).toContain("application/ld+json");
    expect(page.title).toBe("Hello page");
    expect(page.siteName).toBe("Example");

    const [calledUrl, init] = fetchMock.mock.calls[0] as [string, FetchInit];
    expect(calledUrl).toBe("https://api.firecrawl.dev/v2/scrape");
    expect(init.method).toBe("POST");
  });

  it("accepts root-level markdown/html when data is missing", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        markdown: "root md",
        html: "<p>root</p>",
      }),
    );

    const page = await scrapePage("https://example.com/root");
    expect(page.markdown).toBe("root md");
    expect(page.html).toBe("<p>root</p>");
  });

  it("caches the same URL for the lifetime of the process", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        success: true,
        data: { markdown: "once", html: "<p>once</p>" },
      }),
    );

    await scrapePage("https://example.com/cached");
    await scrapePage("https://example.com/cached");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to a direct GET when the key is missing", async () => {
    vi.stubEnv("FIRECRAWL_API_KEY", "");
    fetchMock.mockResolvedValueOnce(htmlResponse("<html><p>direct</p></html>"));

    const page = await scrapePage("https://example.com/direct");
    expect(page.source).toBe("direct");
    expect(page.html).toContain("direct");
    expect(page.markdown).toBeNull();

    const [calledUrl, init] = fetchMock.mock.calls[0] as [string, FetchInit];
    expect(calledUrl).toBe("https://example.com/direct");
    expect(init.method).toBeUndefined();
  });

  it("falls back to a direct GET when Firecrawl errors", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ success: false, error: "quota" }, false, 402))
      .mockResolvedValueOnce(htmlResponse("<html>fallback</html>"));

    const page = await scrapePage("https://example.com/quota");
    expect(page.source).toBe("direct");
    expect(page.html).toContain("fallback");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("fetchHtml", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    clearScrapeCache();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("FIRECRAWL_API_KEY", "fc-test");
  });

  afterEach(() => {
    clearScrapeCache();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("asks Firecrawl for the full DOM, not main content", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: { rawHtml: "<html><a href='/x'>list</a></html>" },
      }),
    );

    const html = await fetchHtml("https://example.com/list");
    expect(html).toContain("href='/x'");

    const [, init] = fetchMock.mock.calls[0] as [string, { body?: string }];
    const body = JSON.parse(init.body ?? "{}") as {
      onlyMainContent?: boolean;
      formats?: string[];
    };
    expect(body.onlyMainContent).toBe(false);
    expect(body.formats).toEqual(["rawHtml", "html"]);
  });
});
