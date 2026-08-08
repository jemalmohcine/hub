import { fetchJson, HTTP_TIMEOUTS } from "@/lib/http/fetch-text";
import type { RepoFacts } from "@/modules/dev-tools/scoring";
import type { ToolCategory } from "@/modules/dev-tools/types";

/** Repository facts and topic search. Works unauthenticated; `GITHUB_TOKEN` only raises the rate limit. */

const API = "https://api.github.com";

function headers(): Record<string, string> {
  const base: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) base.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return base;
}

type RepoResponse = {
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  topics?: string[];
  language: string | null;
  license: { spdx_id: string | null; name: string | null } | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  created_at: string;
  pushed_at: string;
  archived: boolean;
  fork: boolean;
};

type ReleaseResponse = { tag_name: string; published_at: string | null; draft: boolean };

export type GithubRepo = RepoFacts & {
  fullName: string;
  description: string | null;
  homepage: string | null;
  topics: string[];
  language: string | null;
  openIssues: number | null;
  lastReleaseTag: string | null;
};

export async function fetchRepo(fullName: string): Promise<GithubRepo | null> {
  let repo: RepoResponse;
  try {
    repo = await fetchJson<RepoResponse>(`${API}/repos/${fullName}`, {
      headers: headers(),
      timeoutMs: HTTP_TIMEOUTS.api,
    });
  } catch {
    return null;
  }

  const release = await fetchJson<ReleaseResponse>(`${API}/repos/${fullName}/releases/latest`, {
    headers: headers(),
    timeoutMs: HTTP_TIMEOUTS.api,
  }).catch(() => null);

  return {
    fullName: repo.full_name,
    description: repo.description,
    homepage: repo.homepage?.trim() || null,
    topics: repo.topics ?? [],
    language: repo.language,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
    createdAt: repo.created_at,
    lastCommitAt: repo.pushed_at,
    lastReleaseAt: release && !release.draft ? release.published_at : null,
    lastReleaseTag: release && !release.draft ? release.tag_name : null,
    license: repo.license?.spdx_id && repo.license.spdx_id !== "NOASSERTION"
      ? repo.license.spdx_id
      : repo.license?.name ?? null,
    isArchived: repo.archived,
  };
}

/** Repos that are lists, courses or demos rather than something you deploy. */
const NOT_A_TOOL =
  /(awesome|tutorial|course|book|roadmap|interview|cheat[- ]?sheet|examples?|boilerplate|starter|template|handbook|guide|learn|курс|demo)$|^(awesome|learn|30-days)/i;

const TOPIC_QUERIES: Record<ToolCategory, string[]> = {
  ai_api: ["llm", "llmops", "inference"],
  hosting: ["paas", "serverless", "self-hosted"],
  database: ["database", "postgresql", "vector-database"],
  auth: ["authentication", "oauth2", "identity-provider"],
  ci_cd: ["ci-cd", "continuous-deployment"],
  monitoring: ["observability", "monitoring", "opentelemetry"],
  email: ["email", "smtp"],
  storage: ["object-storage", "s3"],
  saas: ["developer-tools", "low-code"],
  other: [],
};

export type DiscoveredRepo = GithubRepo & { category: ToolCategory; topic: string };

/**
 * Find popular, actively maintained repos per category. This is where the
 * "outils très populaires" half of the catalogue comes from — the seed list
 * cannot keep up with what the ecosystem adopts.
 */
export async function discoverRepos(options: {
  category: ToolCategory;
  minStars: number;
  perTopic: number;
}): Promise<DiscoveredRepo[]> {
  const topics = TOPIC_QUERIES[options.category];
  const found: DiscoveredRepo[] = [];

  for (const topic of topics) {
    const query = encodeURIComponent(
      `topic:${topic} stars:>${options.minStars} archived:false`,
    );
    const url = `${API}/search/repositories?q=${query}&sort=stars&order=desc&per_page=${options.perTopic}`;

    const page = await fetchJson<{ items: RepoResponse[] }>(url, {
      headers: headers(),
      timeoutMs: HTTP_TIMEOUTS.slow,
    }).catch(() => null);

    if (!page?.items) continue;

    for (const repo of page.items) {
      const shortName = repo.full_name.split("/")[1] ?? repo.full_name;
      if (repo.fork || repo.archived) continue;
      if (!repo.description || repo.description.length < 20) continue;
      if (NOT_A_TOOL.test(shortName)) continue;
      // No licence means nobody can legally build on it, whatever its star count.
      if (!repo.license?.spdx_id) continue;
      if (Date.now() - Date.parse(repo.created_at) < 90 * 86_400_000) continue;

      found.push({
        category: options.category,
        topic,
        fullName: repo.full_name,
        description: repo.description,
        homepage: repo.homepage?.trim() || null,
        topics: repo.topics ?? [],
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        openIssues: repo.open_issues_count,
        createdAt: repo.created_at,
        lastCommitAt: repo.pushed_at,
        lastReleaseAt: null,
        lastReleaseTag: null,
        license: repo.license?.spdx_id && repo.license.spdx_id !== "NOASSERTION"
          ? repo.license.spdx_id
          : repo.license?.name ?? null,
        isArchived: repo.archived,
      });
    }
  }

  return found;
}
