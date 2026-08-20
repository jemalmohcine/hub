import * as cheerio from "cheerio";
import { formatCompactNumber } from "@/lib/numbers";
import { fetchJson, fetchText } from "@/lib/http/fetch-text";
import { DEV_SIGNAL_RE } from "@/modules/ai-intel/score";
import type { RawHit } from "@/modules/ai-intel/types";

type GhRepo = {
  full_name?: string;
  description?: string | null;
  stargazers_count?: number;
  forks_count?: number;
  language?: string | null;
  topics?: string[];
  open_issues_count?: number;
  html_url?: string;
};

function parseCount(text: string): number {
  const n = Number(text.replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
}

async function fetchGithubRepo(repo: string): Promise<GhRepo | null> {
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
    };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    return await fetchJson<GhRepo>(
      `https://api.github.com/repos/${repo}`,
      { timeoutMs: 10_000, headers },
    );
  } catch {
    return null;
  }
}

export async function collectGithubTrending(
  sourceId: string,
  url: string,
): Promise<RawHit[]> {
  const html = await fetchText(url, {
    headers: { Accept: "text/html" },
    timeoutMs: 14_000,
  });
  const $ = cheerio.load(html);
  const rows: {
    repo: string;
    description: string;
    starsToday: number;
    starsWeek: number;
    language: string | null;
    rank: number;
  }[] = [];

  $("article.Box-row").each((idx, el) => {
    if (rows.length >= 25) return;
    const href =
      $(el).find("h2 a").attr("href") ||
      $(el).find("a[href^='/']").first().attr("href") ||
      "";
    const repo = href.replace(/^\//, "").replace(/\/$/, "");
    if (!/^[^/]+\/[^/]+$/.test(repo)) return;

    const description = $(el)
      .find("p")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim();

    const todayText = $(el).text();
    const todayMatch = todayText.match(/([\d,]+)\s*stars?\s*today/i);
    const starsToday = todayMatch ? parseCount(todayMatch[1]) : 0;
    const weekMatch = todayText.match(/([\d,]+)\s*stars?\s*this\s*week/i);
    const starsWeek = weekMatch ? parseCount(weekMatch[1]) : 0;
    const language =
      $(el).find('[itemprop="programmingLanguage"]').first().text().trim() ||
      null;

    rows.push({
      repo,
      description,
      starsToday,
      starsWeek,
      language,
      rank: idx + 1,
    });
  });

  const hits: RawHit[] = [];
  for (let i = 0; i < rows.length; i += 4) {
    const batch = rows.slice(i, i + 4);
    const enriched = await Promise.all(
      batch.map(async (row) => {
        const api = await fetchGithubRepo(row.repo);
        const stars = api?.stargazers_count ?? 0;
        const forks = api?.forks_count ?? 0;
        const description =
          (api?.description || row.description || "").trim();
        const language = api?.language || row.language;
        const topics = api?.topics ?? [];

        const summary = [
          description,
          stars ? `${formatCompactNumber(stars)} stars` : "",
          row.starsToday ? `+${formatCompactNumber(row.starsToday)} today` : "",
          row.starsWeek
            ? `+${formatCompactNumber(row.starsWeek)} this week`
            : row.starsToday
              ? `~${formatCompactNumber(row.starsToday * 5)} est. week`
              : "",
          forks ? `${formatCompactNumber(forks)} forks` : "",
          language || "",
        ]
          .filter(Boolean)
          .join(" · ");

        const hit: RawHit = {
          title: row.repo,
          summary,
          url: api?.html_url || `https://github.com/${row.repo}`,
          sourceId,
          externalId: row.repo,
          publishedAt: new Date().toISOString(),
          raw: {
            provider: "github-trending",
            kind: "repo",
            description,
            comments: description,
            stars,
            starsToday: row.starsToday,
            starsWeek: row.starsWeek || (row.starsToday > 0 ? row.starsToday * 5 : 0),
            starsWeekEstimate: row.starsWeek ? false : row.starsToday > 0,
            forks,
            language,
            topics,
            rank: row.rank,
            openIssues: api?.open_issues_count ?? null,
          },
        };
        return hit;
      }),
    );
    hits.push(...enriched);
  }

  // AI-related repos only. Non-AI trending is not this feed.
  return hits
    .filter((h) => {
      const blob = `${h.title} ${h.summary} ${JSON.stringify(h.raw?.topics ?? [])}`;
      return DEV_SIGNAL_RE.test(blob);
    })
    .slice(0, 22);
}
