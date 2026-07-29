import * as cheerio from "cheerio";
import { fetchText } from "@/modules/ai-intel/collectors/fetch";
import { formatStars } from "@/modules/ai-intel/score";
import type { RawHit } from "@/modules/ai-intel/types";

type ListItem = { position?: number; url?: string; name?: string };

function parseStarCount(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  const n = Number(value.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

async function enrichGitTrendRepo(
  sourceId: string,
  pageUrl: string,
  rank: number | null,
): Promise<RawHit | null> {
  const html = await fetchText(pageUrl, { timeoutMs: 12_000 });
  const $ = cheerio.load(html);

  type SoftwareSource = {
    name?: string;
    description?: string;
    codeRepository?: string;
    programmingLanguage?: string;
    interactionStatistic?: Array<{
      interactionType?: string;
      userInteractionCount?: number | string;
    }>;
  };

  const scripts = $('script[type="application/ld+json"]')
    .toArray()
    .map((el) => $(el).text());

  let software: SoftwareSource | null = null;
  for (const text of scripts) {
    try {
      const data = JSON.parse(text) as SoftwareSource & { "@type"?: string };
      if (data["@type"] === "SoftwareSourceCode") {
        software = data;
        break;
      }
    } catch {
      // ignore
    }
  }

  if (!software) return null;

  const repoName = String(software.name ?? "");
  const description = String(software.description ?? "").trim();
  const codeRepository = String(software.codeRepository ?? "");
  const language = software.programmingLanguage
    ? String(software.programmingLanguage)
    : null;

  let stars = 0;
  let forks = 0;
  const stats = software.interactionStatistic;
  if (Array.isArray(stats)) {
    for (const row of stats) {
      const type = row.interactionType || "";
      if (type.includes("LikeAction")) stars = parseStarCount(row.userInteractionCount);
      if (type.includes("FollowAction")) forks = parseStarCount(row.userInteractionCount);
    }
  }

  // Fallback from meta description "★ 12.0k stars"
  if (!stars) {
    const meta = $('meta[name="description"]').attr("content") || "";
    const m = meta.match(/([\d.]+)\s*k\s*stars/i);
    if (m) stars = Math.round(parseFloat(m[1]) * 1000);
  }

  const githubUrl =
    codeRepository ||
    (repoName.includes("/")
      ? `https://github.com/${repoName}`
      : pageUrl);

  const summary = [
    description,
    stars ? `${formatStars(stars)} stars` : "",
    forks ? `${formatStars(forks)} forks` : "",
    language ? language : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    title: repoName || githubUrl,
    summary,
    url: githubUrl,
    sourceId,
    externalId: repoName || githubUrl,
    publishedAt: new Date().toISOString(),
    raw: {
      provider: "gittrend",
      kind: "repo",
      description,
      stars,
      forks,
      language,
      rank,
      comments: description,
    },
  };
}

export async function collectGitTrend(
  sourceId: string,
  url: string,
): Promise<RawHit[]> {
  const html = await fetchText(url, { timeoutMs: 12_000 });
  const $ = cheerio.load(html);

  const listItems: ListItem[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).text()) as {
        "@type"?: string;
        itemListElement?: ListItem[];
      };
      if (data["@type"] === "ItemList" && Array.isArray(data.itemListElement)) {
        listItems.push(...data.itemListElement);
      }
    } catch {
      // ignore
    }
  });

  const targets = listItems
    .filter((i) => i.url && i.name)
    .slice(0, 16);

  const hits: RawHit[] = [];
  for (let i = 0; i < targets.length; i += 3) {
    const batch = targets.slice(i, i + 3);
    const enriched = await Promise.all(
      batch.map(async (item) => {
        try {
          return await enrichGitTrendRepo(
            sourceId,
            String(item.url),
            item.position ?? null,
          );
        } catch {
          return null;
        }
      }),
    );
    for (const hit of enriched) if (hit) hits.push(hit);
  }

  return hits;
}
