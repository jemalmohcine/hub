import { createAdminClient } from "@/core/auth/supabase/admin";
import { fetchText } from "@/modules/ai-intel/collectors/fetch";
import type { AiPillar, SourceKind } from "@/modules/ai-intel/types";

type DiscoveredCandidate = {
  id: string;
  name: string;
  url: string;
  kind: SourceKind;
  pillar_hints: AiPillar[];
  quality_score: number;
  discovery_reason: string;
};

type TavilyResult = {
  title?: string;
  url?: string;
  content?: string;
};

function slugFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 48);
  } catch {
    return `src-${Date.now()}`;
  }
}

function scoreCandidate(title: string, content: string, url: string): number {
  const blob = `${title} ${content} ${url}`.toLowerCase();
  let score = 4;
  if (/\b(ai news|llm|artificial intelligence|machine learning)\b/.test(blob)) {
    score += 2;
  }
  if (/\b(tools? directory|aggregator|digest|changelog|newsletter)\b/.test(blob)) {
    score += 1.5;
  }
  if (/\b(rss|atom|feed)\b/.test(blob) || /\/(rss|feed|atom)/.test(url)) {
    score += 1.5;
  }
  if (/\b(casino|crypto pump|forex|dating)\b/.test(blob)) score -= 5;
  return Math.max(0, Math.min(10, score));
}

async function searchTavily(query: string): Promise<TavilyResult[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return [];

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: key,
      query,
      search_depth: "basic",
      max_results: 8,
      include_answer: false,
    }),
  });
  if (!res.ok) {
    throw new Error(`Tavily HTTP ${res.status}`);
  }
  const data = (await res.json()) as { results?: TavilyResult[] };
  return data.results ?? [];
}

async function detectRss(homeUrl: string): Promise<string | null> {
  try {
    const html = await fetchText(homeUrl, { timeoutMs: 8_000 });
    const m = html.match(
      /<link[^>]+type=["']application\/(rss|atom)\+xml["'][^>]+href=["']([^"']+)["']/i,
    );
    if (m?.[2]) {
      return new URL(m[2], homeUrl).toString();
    }
    const guess = new URL("/feed", homeUrl).toString();
    const probe = await fetch(guess, { method: "HEAD" }).catch(() => null);
    if (probe?.ok) return guess;
  } catch {
    // ignore
  }
  return null;
}

const DISCOVERY_QUERIES = [
  "best AI news aggregator website 2026",
  "AI tools directory newly added",
  "LLM changelog model releases news site",
  "AI regulation news dedicated site",
  "GitHub trending AI repositories tracker",
];

export async function discoverNewSources(): Promise<{
  found: number;
  added: number;
  activated: number;
  skipped: number;
  error?: string;
}> {
  const stats = { found: 0, added: 0, activated: 0, skipped: 0, error: undefined as string | undefined };

  if (!process.env.TAVILY_API_KEY) {
    stats.error = "TAVILY_API_KEY missing — discovery skipped";
    return stats;
  }

  const admin = createAdminClient();
  const { data: existing } = await admin.from("ai_intel_sources").select("id, url");
  const knownHosts = new Set(
    (existing ?? []).map((s) => {
      try {
        return new URL(s.url as string).hostname.replace(/^www\./, "");
      } catch {
        return String(s.id);
      }
    }),
  );

  const candidates: DiscoveredCandidate[] = [];

  for (const query of DISCOVERY_QUERIES) {
    try {
      const results = await searchTavily(query);
      for (const r of results) {
        if (!r.url) continue;
        let host: string;
        try {
          host = new URL(r.url).hostname.replace(/^www\./, "");
        } catch {
          continue;
        }
        if (knownHosts.has(host)) {
          stats.skipped += 1;
          continue;
        }
        const score = scoreCandidate(r.title ?? "", r.content ?? "", r.url);
        stats.found += 1;
        if (score < 6) {
          stats.skipped += 1;
          continue;
        }

        const rss = await detectRss(r.url);
        const kind: SourceKind = rss ? "rss" : "html";
        const feedOrHome = rss ?? r.url;
        const id = `auto-${slugFromUrl(feedOrHome)}`;
        if (candidates.some((c) => c.id === id)) continue;

        const pillar_hints: AiPillar[] = /regulat|policy|law|ban/i.test(
          `${r.title} ${r.content}`,
        )
          ? ["world"]
          : /github|repo|open.?source/i.test(`${r.title} ${r.content}`)
            ? ["opensource"]
            : /tool|directory|ide|mcp/i.test(`${r.title} ${r.content}`)
              ? ["tools"]
              : ["models", "tools"];

        candidates.push({
          id,
          name: r.title?.slice(0, 80) || host,
          url: feedOrHome,
          kind,
          pillar_hints,
          quality_score: score,
          discovery_reason: `query:${query}`,
        });
        knownHosts.add(host);
      }
    } catch (err) {
      stats.error = err instanceof Error ? err.message : String(err);
    }
  }

  for (const c of candidates) {
    const autoActive = c.quality_score >= 7.5 && c.kind === "rss";
    const { error } = await admin.from("ai_intel_sources").upsert(
      {
        id: c.id,
        name: c.name,
        url: c.url,
        kind: c.kind,
        pillar_hints: c.pillar_hints,
        priority: 40,
        enabled: autoActive,
        status: autoActive ? "active" : "candidate",
        quality_score: c.quality_score,
        discovered_at: new Date().toISOString(),
        discovery_reason: c.discovery_reason,
      },
      { onConflict: "id" },
    );
    if (!error) {
      stats.added += 1;
      if (autoActive) stats.activated += 1;
    }
  }

  return stats;
}
