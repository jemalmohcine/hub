import { createClient } from "@/core/auth/supabase/server";
import type {
  AiIntelItem,
  AiIntelRun,
  AiPillar,
  AiUrgency,
  FeedFilters,
} from "@/modules/ai-intel/types";

export async function getLatestAiIntelRun(): Promise<AiIntelRun | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_intel_runs")
    .select("*")
    .not("finished_at", "is", null)
    .order("finished_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as AiIntelRun | null) ?? null;
}

export async function getAiIntelFeed(
  userId: string,
  filters: FeedFilters = {},
): Promise<AiIntelItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from("ai_intel_items")
    .select("*")
    .order("ingested_at", { ascending: false })
    .limit(500);

  if (filters.pillar && filters.pillar !== "all") {
    query = query.eq("pillar", filters.pillar);
  }
  if (filters.urgency && filters.urgency !== "all") {
    query = query.eq("urgency", filters.urgency);
  }
  if (filters.category && filters.category !== "all") {
    query = query.eq("category", filters.category);
  }
  if (filters.q?.trim()) {
    const q = filters.q.trim().replace(/[%_]/g, "");
    query = query.or(`title.ilike.%${q}%,summary.ilike.%${q}%`);
  }

  const { data: items, error } = await query;
  if (error) throw new Error(error.message);

  const list = (items ?? []) as AiIntelItem[];
  if (list.length === 0) return [];

  const { data: saves } = await supabase
    .from("ai_intel_saves")
    .select("item_id")
    .eq("user_id", userId);

  const savedIds = new Set((saves ?? []).map((s) => s.item_id as string));

  let withSaved = list.map((item) => ({
    ...item,
    source_refs: Array.isArray(item.source_refs) ? item.source_refs : [],
    saved: savedIds.has(item.id),
  }));

  if (filters.savedOnly) {
    withSaved = withSaved.filter((i) => i.saved);
  }

  return withSaved;
}

export type FeedFilterParams = {
  pillar?: string;
  urgency?: string;
  category?: string;
  saved?: string;
  q?: string;
};

export function parseFeedFilters(params: FeedFilterParams): FeedFilters {
  const pillars: AiPillar[] = ["models", "tools", "opensource", "world"];
  const urgencies: AiUrgency[] = ["urgent", "medium", "light"];

  return {
    pillar: pillars.includes(params.pillar as AiPillar)
      ? (params.pillar as AiPillar)
      : "all",
    urgency: urgencies.includes(params.urgency as AiUrgency)
      ? (params.urgency as AiUrgency)
      : "all",
    category: params.category || "all",
    savedOnly: params.saved === "1" || params.saved === "true",
    q: params.q ?? "",
  };
}
