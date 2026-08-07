import { fetchJson, fetchText } from "@/lib/http/fetch-text";

export type ScrapedGithubRepo = {
  fullName: string;
  description: string | null;
  readme: string | null;
  topics: string[];
  language: string | null;
  homepage: string | null;
  license: string | null;
  stars: number;
  forks: number;
};

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

/** Fetch README + metadata for a GitHub repository. */
export async function scrapeGithubRepo(repo: string): Promise<ScrapedGithubRepo | null> {
  if (!/^[^/]+\/[^/]+$/.test(repo)) return null;

  try {
    const headers = githubHeaders();
    const [meta, readme] = await Promise.all([
      fetchJson<{
        full_name?: string;
        description?: string | null;
        topics?: string[];
        language?: string | null;
        homepage?: string | null;
        license?: { spdx_id?: string } | null;
        stargazers_count?: number;
        forks_count?: number;
      }>(`https://api.github.com/repos/${repo}`, { timeoutMs: 12_000, headers }),
      fetchText(`https://api.github.com/repos/${repo}/readme`, {
        timeoutMs: 12_000,
        headers: { ...headers, Accept: "application/vnd.github.raw" },
      }).catch(() => null),
    ]);

    return {
      fullName: meta.full_name || repo,
      description: meta.description?.trim() || null,
      readme: readme ? readme.slice(0, 12_000) : null,
      topics: meta.topics ?? [],
      language: meta.language || null,
      homepage: meta.homepage?.trim() || null,
      license: meta.license?.spdx_id || null,
      stars: meta.stargazers_count ?? 0,
      forks: meta.forks_count ?? 0,
    };
  } catch {
    return null;
  }
}
