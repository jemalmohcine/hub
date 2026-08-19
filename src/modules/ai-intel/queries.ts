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
    .order("published_at", { ascending: false, nullsFirst: false })
    // Year inbox / « À traiter » needs more than a couple of scrape days.
    .limit(1500);

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

  let readIds = new Set<string>();
  try {
    const { data: reads, error: readsError } = await supabase
      .from("ai_intel_reads")
      .select("item_id")
      .eq("user_id", userId);
    if (!readsError) {
      readIds = new Set((reads ?? []).map((r) => r.item_id as string));
    }
  } catch {
    // Migration 006 may not be applied yet
  }

  let withSaved = list.map((item) => ({
    ...item,
    source_refs: Array.isArray(item.source_refs) ? item.source_refs : [],
    saved: savedIds.has(item.id),
    read: readIds.has(item.id),
  }));

  if (filters.savedOnly) {
    withSaved = withSaved.filter((i) => i.saved);
  }

  // Prefer impact + score when metadata is present (client re-sorts too)
  withSaved.sort((a, b) => {
    const ua = a.urgency === "urgent" ? 0 : a.urgency === "medium" ? 1 : 2;
    const ub = b.urgency === "urgent" ? 0 : b.urgency === "medium" ? 1 : 2;
    if (ua !== ub) return ua - ub;
    const sa = Number(a.metadata?.score) || 0;
    const sb = Number(b.metadata?.score) || 0;
    if (sa !== sb) return sb - sa;
    return (
      new Date(b.published_at || 0).getTime() -
      new Date(a.published_at || 0).getTime()
    );
  });

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
