import { createAdminClient } from "@/core/auth/supabase/admin";
import { mapPool } from "@/lib/async-pool";
import { slugify } from "@/lib/slug";
import { collapseWhitespace, foldCase, truncateAtWord } from "@/lib/text";
import { EXPENSE_CATEGORIES } from "@/modules/dev-expenses/types";
import { discoverRepos, fetchRepo, type GithubRepo } from "@/modules/dev-tools/github";
import {
  classifyTool,
  isToolLlmAvailable,
  remainingToolLlmBudget,
  resetToolLlmBudget,
} from "@/modules/dev-tools/llm-classify";
import {
  detectFreeTier,
  detectStartingPrice,
  scrapePricingText,
} from "@/modules/dev-tools/pricing";
import {
  maturityFrom,
  overallScore,
  popularityFromStars,
  stabilityFromRepo,
} from "@/modules/dev-tools/scoring";
import { TOOL_SEEDS, type ToolSeed } from "@/modules/dev-tools/seeds";
import type {
  Audience,
  Maturity,
  PricingModel,
  ToolCategory,
  ToolDataSource,
} from "@/modules/dev-tools/types";

/**
 * Daily catalogue refresh: `seeds + GitHub discovery → repo metrics →
 * pricing scrape → LLM classification → upsert`.
 *
 * Measured facts (stars, licence, release dates) are refreshed every run
 * because they are cheap. The editorial layer costs an LLM call, so a row is
 * only re-classified when it is new or older than the refresh window.
 */

const REPO_CONCURRENCY = 6;
const DISCOVERY_MIN_STARS = Number(process.env.DEV_TOOLS_MIN_STARS || 2_000);
const DISCOVERY_PER_TOPIC = Number(process.env.DEV_TOOLS_PER_TOPIC || 6);
const REFRESH_DAYS = Number(process.env.DEV_TOOLS_REFRESH_DAYS || 7);
const DAY_MS = 86_400_000;

type ExistingRow = {
  slug: string;
  tagline: string | null;
  data_source: ToolDataSource;
  scraped_at: string | null;
};

type ToolRow = {
  slug: string;
  name: string;
  category: ToolCategory;
  tagline: string | null;
  summary: string | null;
  website_url: string | null;
  pricing_url: string | null;
  docs_url: string | null;
  repo_full_name: string | null;
  pricing_model: PricingModel;
  has_free_tier: boolean;
  free_tier_note: string | null;
  starting_price_eur: number | null;
  license: string | null;
  stars: number | null;
  forks: number | null;
  open_issues: number | null;
  repo_created_at: string | null;
  last_commit_at: string | null;
  last_release_at: string | null;
  last_release_tag: string | null;
  is_archived: boolean;
  popularity_score: number;
  stability_score: number;
  overall_score: number;
  maturity: Maturity;
  audience: Audience;
  best_for: string | null;
  pros: string[];
  cons: string[];
  tags: string[];
  alternative_slugs: string[];
  data_source: ToolDataSource;
  discovered_via: string | null;
  raw: Record<string, unknown>;
  scraped_at: string;
};

type Candidate = {
  slug: string;
  name: string;
  category: ToolCategory;
  seed: ToolSeed | null;
  repoFullName: string | null;
  /** Set for discovery hits, where search already returned the metadata. */
  prefetched: GithubRepo | null;
  discoveredVia: string;
};

function isStale(existing: ExistingRow | undefined, now: number): boolean {
  if (!existing) return true;
  if (!existing.tagline) return true;
  if (!existing.scraped_at) return true;
  return now - Date.parse(existing.scraped_at) > REFRESH_DAYS * DAY_MS;
}

async function buildCandidates(): Promise<Candidate[]> {
  const candidates: Candidate[] = [];
  const takenSlugs = new Set<string>();
  const takenRepos = new Set<string>();

  for (const seed of TOOL_SEEDS) {
    candidates.push({
      slug: seed.slug,
      name: seed.name,
      category: seed.category,
      seed,
      repoFullName: seed.repo ?? null,
      prefetched: null,
      discoveredVia: "seed",
    });
    takenSlugs.add(seed.slug);
    if (seed.repo) takenRepos.add(foldCase(seed.repo));
  }

  for (const category of EXPENSE_CATEGORIES) {
    const repos = await discoverRepos({
      category,
      minStars: DISCOVERY_MIN_STARS,
      perTopic: DISCOVERY_PER_TOPIC,
    }).catch(() => []);

    for (const repo of repos) {
      if (takenRepos.has(foldCase(repo.fullName))) continue;

      const shortName = repo.fullName.split("/")[1] ?? repo.fullName;
      const slug = slugify(shortName);
      if (!slug || takenSlugs.has(slug)) continue;

      takenSlugs.add(slug);
      takenRepos.add(foldCase(repo.fullName));

      candidates.push({
        slug,
        name: shortName,
        category: repo.category,
        seed: null,
        repoFullName: repo.fullName,
        prefetched: repo,
        discoveredVia: `github:topic:${repo.topic}`,
      });
    }
  }

  return candidates;
}

function pricingModelFromLicense(license: string | null): PricingModel {
  return license ? "open_source" : "unknown";
}

async function buildRow(
  candidate: Candidate,
  existing: ExistingRow | undefined,
  now: number,
): Promise<ToolRow | null> {
  const seed = candidate.seed;

  // Search results carry no release info, so every repo gets a real lookup;
  // the search payload is only the fallback when that lookup fails.
  const repo = candidate.repoFullName
    ? (await fetchRepo(candidate.repoFullName)) ?? candidate.prefetched
    : null;

  const websiteUrl =
    seed?.websiteUrl ?? repo?.homepage ?? (repo ? `https://github.com/${repo.fullName}` : null);
  const pricingUrl = seed?.pricingUrl ?? null;

  let popularity = repo ? popularityFromStars(repo.stars) : seed?.baselinePopularity ?? 0;
  let stability = repo
    ? stabilityFromRepo(repo, now)
    : seed?.baselineStability ?? 0;

  let dataSource: ToolDataSource = repo ? "github" : "seed";
  let pricingModel: PricingModel =
    seed?.pricingModel ?? (repo ? pricingModelFromLicense(repo.license) : "unknown");
  let hasFreeTier = pricingModel === "open_source" || pricingModel === "free";
  let freeTierNote: string | null = null;
  let startingPrice: number | null = null;

  let name = candidate.name;
  let category = candidate.category;
  let tagline = seed?.tagline ?? repo?.description ?? null;
  let summary: string | null = null;
  let audience: Audience = seed?.audience ?? "any";
  let bestFor: string | null = null;
  let pros: string[] = [];
  let cons: string[] = [];
  let tags: string[] = repo?.topics.slice(0, 4) ?? [];
  let alternativeNames: string[] = [];

  if (isStale(existing, now)) {
    const pricingText = pricingUrl ? await scrapePricingText(pricingUrl) : null;

    if (pricingText) {
      const free = detectFreeTier(pricingText);
      hasFreeTier = hasFreeTier || free.hasFreeTier;
      freeTierNote = free.note;
      startingPrice = detectStartingPrice(pricingText);
      dataSource = "scrape";
    }

    const classified = await classifyTool({
      name: candidate.name,
      category: candidate.category,
      websiteUrl,
      repoFullName: repo?.fullName ?? null,
      description: repo?.description ?? seed?.tagline ?? null,
      topics: repo?.topics,
      license: repo?.license ?? null,
      stars: repo?.stars ?? null,
      pricingText,
    });

    if (classified) {
      if (!classified.isRealTool) return null;

      dataSource = "llm";
      name = classified.name;
      category = seed ? seed.category : classified.category;
      tagline = classified.tagline || tagline;
      summary = classified.summary || null;
      pricingModel = seed?.pricingModel ?? classified.pricingModel;
      hasFreeTier = classified.hasFreeTier || pricingModel === "open_source";
      freeTierNote = classified.freeTierNote ?? freeTierNote;
      startingPrice = classified.startingPriceEur ?? startingPrice;
      audience = seed?.audience ?? classified.audience;
      bestFor = classified.bestFor || null;
      pros = classified.pros;
      cons = classified.cons;
      tags = classified.tags.length ? classified.tags : tags;
      alternativeNames = classified.alternatives;

      // Hosted products have no repo to measure, so the model's read is all we have.
      if (!repo) {
        popularity = seed?.baselinePopularity ?? classified.adoption;
        stability = seed?.baselineStability ?? classified.reliability;
      }
    }
  }

  const overall = overallScore(popularity, stability);

  return {
    slug: candidate.slug,
    name: truncateAtWord(name, 60),
    category,
    tagline: tagline ? truncateAtWord(collapseWhitespace(tagline), 130) : null,
    summary,
    website_url: websiteUrl,
    pricing_url: pricingUrl,
    docs_url: seed?.docsUrl ?? null,
    repo_full_name: repo?.fullName ?? null,
    pricing_model: pricingModel,
    has_free_tier: hasFreeTier,
    free_tier_note: freeTierNote,
    starting_price_eur: startingPrice,
    license: repo?.license ?? null,
    stars: repo?.stars ?? null,
    forks: repo?.forks ?? null,
    open_issues: repo?.openIssues ?? null,
    repo_created_at: repo?.createdAt ?? null,
    last_commit_at: repo?.lastCommitAt ?? null,
    last_release_at: repo?.lastReleaseAt ?? null,
    last_release_tag: repo?.lastReleaseTag ?? null,
    is_archived: repo?.isArchived ?? false,
    popularity_score: popularity,
    stability_score: stability,
    overall_score: overall,
    maturity: repo
      ? maturityFrom(stability, repo.createdAt, repo.isArchived, now)
      : maturityFrom(stability, null, false, now),
    audience,
    best_for: bestFor,
    pros,
    cons,
    tags,
    alternative_slugs: [],
    data_source: dataSource,
    discovered_via: candidate.discoveredVia,
    raw: { alternativeNames },
    scraped_at: new Date(now).toISOString(),
  };
}

/** Resolve the model's free-text competitor names against slugs we actually have. */
function linkAlternatives(rows: ToolRow[]): void {
  const byName = new Map<string, string>();
  for (const row of rows) {
    byName.set(foldCase(row.name), row.slug);
    byName.set(foldCase(row.slug), row.slug);
  }

  for (const row of rows) {
    const names = (row.raw.alternativeNames as string[] | undefined) ?? [];
    const slugs = new Set<string>();

    for (const name of names) {
      const match = byName.get(foldCase(name));
      if (match && match !== row.slug) slugs.add(match);
    }

    // Fill up with the best-ranked peers so every row can answer "et sinon ?".
    if (slugs.size < 3) {
      const peers = rows
        .filter((other) => other.slug !== row.slug && other.category === row.category)
        .sort((a, b) => b.overall_score - a.overall_score);
      for (const peer of peers) {
        if (slugs.size >= 3) break;
        slugs.add(peer.slug);
      }
    }

    row.alternative_slugs = [...slugs];
    row.raw = {};
  }
}

export async function runDevToolsIngest() {
  const admin = createAdminClient();
  const now = Date.now();
  resetToolLlmBudget();

  const { data: existingRows } = await admin
    .from("dev_tools")
    .select("slug, tagline, data_source, scraped_at");

  const existing = new Map<string, ExistingRow>(
    ((existingRows as ExistingRow[]) ?? []).map((row) => [row.slug, row]),
  );

  const candidates = await buildCandidates();

  const built = await mapPool(candidates, REPO_CONCURRENCY, async (candidate) => {
    try {
      return await buildRow(candidate, existing.get(candidate.slug), now);
    } catch (err) {
      console.warn(`[dev-tools] ${candidate.slug} failed:`, err instanceof Error ? err.message : err);
      return null;
    }
  });

  const rows = built.filter((row): row is ToolRow => row !== null);
  linkAlternatives(rows);

  let upserted = 0;
  const CHUNK = 40;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await admin.from("dev_tools").upsert(chunk, { onConflict: "slug" });
    if (error) {
      console.warn("[dev-tools] upsert failed:", error.message);
      continue;
    }
    upserted += chunk.length;
  }

  return {
    candidates: candidates.length,
    seeds: TOOL_SEEDS.length,
    discovered: candidates.length - TOOL_SEEDS.length,
    upserted,
    dropped: candidates.length - rows.length,
    llmAvailable: isToolLlmAvailable(),
    llmBudgetLeft: remainingToolLlmBudget(),
  };
}