import { createClient } from "@/core/auth/supabase/server";
import type { AiIntelItem, AiUrgency, FeedFilters } from "@/modules/ai-intel/types";

const SEVERITY_TO_URGENCY: Record<string, AiUrgency> = {
  critique: "urgent",
  elevee: "medium",
  moyenne: "medium",
  info: "light",
};

const VEILLE_CATEGORY_TO_PILLAR: Record<string, AiIntelItem["pillar"]> = {
  "repos-github": "opensource",
  "modeles-prix": "models",
};

function veilleContentKind(category: string): string {
  switch (category) {
    case "securite":
      return "security";
    case "versions":
      return "breaking";
    case "modeles-prix":
      return "pricing";
    case "outils-agents":
      return "tool";
    case "repos-github":
      return "repo";
    default:
      return "news";
  }
}

function mapVeilleRow(row: Record<string, unknown>): AiIntelItem {
  const severity = String(row.severity ?? "info");
  const category = String(row.category ?? "general");
  const feedDate =
    typeof row.feed_date === "string" ? row.feed_date : null;
  const starsWeek =
    typeof row.stars_week === "number" ? row.stars_week : null;

  return {
    id: row.id as string,
    canonical_key: (row.link as string) ?? (row.id as string),
    pillar: VEILLE_CATEGORY_TO_PILLAR[category] ?? "tools",
    category,
    urgency: SEVERITY_TO_URGENCY[severity] ?? "light",
    title: row.title as string,
    summary: row.summary as string,
    url: row.link as string,
    primary_source: String(row.provider ?? "other"),
    source_refs: [],
    metadata: {
      source: "veille",
      quoi: row.quoi ?? "",
      impact: row.impact ?? "",
      feed_date: feedDate,
      provider: row.provider,
      severity: row.severity,
      tags: row.tags ?? [],
      contentKind: veilleContentKind(category),
      kind: category === "repos-github" ? "repo" : category === "outils-agents" ? "tool" : undefined,
      starsWeek: starsWeek ?? undefined,
      stars: typeof row.stars_month === "number" ? row.stars_month : undefined,
      hardSignal:
        category === "securite"
          ? "security"
          : category === "modeles-prix"
            ? "pricing"
            : undefined,
    },
    published_at: feedDate ? `${feedDate}T12:00:00.000Z` : null,
    ingested_at: (row.created_at as string) ?? new Date().toISOString(),
    updated_at: (row.updated_at as string) ?? new Date().toISOString(),
  };
}

export async function getVeilleIntelFeed(
  userId: string,
  filters: FeedFilters = {},
): Promise<AiIntelItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("veille_ia_items")
    .select("*")
    .order("feed_date", { ascending: false })
    .limit(1500);

  if (filters.q?.trim()) {
    const q = filters.q.trim().replace(/[%_]/g, "");
    query = query.or(`title.ilike.%${q}%,summary.ilike.%${q}%`);
  }

  const { data: items, error } = await query;
  if (error) throw new Error(error.message);
  const list = (items ?? []).map((row) => mapVeilleRow(row as Record<string, unknown>));
  if (list.length === 0) return [];

  const { data: saves } = await supabase
    .from("veille_ia_saves")
    .select("item_id")
    .eq("user_id", userId);
  const savedIds = new Set((saves ?? []).map((s) => s.item_id as string));

  let withSaved = list.map((item) => ({
    ...item,
    saved: savedIds.has(item.id),
    read: false,
  }));

  if (filters.savedOnly) {
    withSaved = withSaved.filter((i) => i.saved);
  }

  return withSaved;
}
