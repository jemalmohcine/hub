import { createClient } from "@/core/auth/supabase/server";
import type {
  Audience,
  DevTool,
  Maturity,
  PricingModel,
  ToolCategory,
  ToolDataSource,
} from "@/modules/dev-tools/types";

const SELECT = `
  id, slug, name, category, tagline, summary, website_url, pricing_url, docs_url,
  repo_full_name, pricing_model, has_free_tier, free_tier_note, starting_price_eur,
  license, stars, forks, open_issues, repo_created_at, last_commit_at, last_release_at,
  last_release_tag, is_archived, popularity_score, stability_score, overall_score,
  maturity, audience, best_for, pros, cons, tags, alternative_slugs, data_source,
  discovered_via, scraped_at, updated_at
`;

function mapTool(row: Record<string, unknown>): DevTool {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    category: row.category as ToolCategory,
    tagline: (row.tagline as string | null) ?? null,
    summary: (row.summary as string | null) ?? null,
    websiteUrl: (row.website_url as string | null) ?? null,
    pricingUrl: (row.pricing_url as string | null) ?? null,
    docsUrl: (row.docs_url as string | null) ?? null,
    repoFullName: (row.repo_full_name as string | null) ?? null,
    pricingModel: row.pricing_model as PricingModel,
    hasFreeTier: Boolean(row.has_free_tier),
    freeTierNote: (row.free_tier_note as string | null) ?? null,
    startingPriceEur:
      row.starting_price_eur == null ? null : Number(row.starting_price_eur),
    license: (row.license as string | null) ?? null,
    stars: row.stars == null ? null : Number(row.stars),
    forks: row.forks == null ? null : Number(row.forks),
    openIssues: row.open_issues == null ? null : Number(row.open_issues),
    repoCreatedAt: (row.repo_created_at as string | null) ?? null,
    lastCommitAt: (row.last_commit_at as string | null) ?? null,
    lastReleaseAt: (row.last_release_at as string | null) ?? null,
    lastReleaseTag: (row.last_release_tag as string | null) ?? null,
    isArchived: Boolean(row.is_archived),
    popularityScore: Number(row.popularity_score) || 0,
    stabilityScore: Number(row.stability_score) || 0,
    overallScore: Number(row.overall_score) || 0,
    maturity: row.maturity as Maturity,
    audience: row.audience as Audience,
    bestFor: (row.best_for as string | null) ?? null,
    pros: (row.pros as string[] | null) ?? [],
    cons: (row.cons as string[] | null) ?? [],
    tags: (row.tags as string[] | null) ?? [],
    alternativeSlugs: (row.alternative_slugs as string[] | null) ?? [],
    dataSource: row.data_source as ToolDataSource,
    discoveredVia: (row.discovered_via as string | null) ?? null,
    scrapedAt: (row.scraped_at as string | null) ?? null,
    updatedAt: row.updated_at as string,
  };
}

/** The whole catalogue — small enough to filter and sort in the browser. */
export async function listDevTools(limit = 300): Promise<DevTool[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dev_tools")
    .select(SELECT)
    .order("overall_score", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map((row) => mapTool(row as Record<string, unknown>));
}

/**
 * Candidate replacements for a line item: same job, cheaper or free, ranked by
 * how safe they are to adopt. This is what grounds the expense diagnostics in
 * scraped facts instead of a hardcoded list.
 */
export async function findAlternativeTools(options: {
  category: ToolCategory;
  excludeSlugs?: string[];
  maxPriceEur?: number | null;
  limit?: number;
}): Promise<DevTool[]> {
  const supabase = await createClient();
  let query = supabase
    .from("dev_tools")
    .select(SELECT)
    .eq("category", options.category)
    .eq("is_archived", false)
    .order("has_free_tier", { ascending: false })
    .order("overall_score", { ascending: false })
    .limit(options.limit ?? 6);

  if (options.excludeSlugs?.length) {
    query = query.not("slug", "in", `(${options.excludeSlugs.join(",")})`);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const tools = data.map((row) => mapTool(row as Record<string, unknown>));
  const ceiling = options.maxPriceEur;
  if (ceiling == null) return tools;

  return tools.filter(
    (tool) => tool.hasFreeTier || (tool.startingPriceEur ?? Infinity) < ceiling,
  );
}

/** When the catalogue was last refreshed, so the UI can be honest about staleness. */
export async function getCatalogFreshness(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("dev_tools")
    .select("scraped_at")
    .order("scraped_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  return (data?.scraped_at as string | null) ?? null;
}
