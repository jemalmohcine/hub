import { createClient } from "@/core/auth/supabase/server";
import { toDayKey } from "@/lib/dates";
import { sortVeilleItems } from "@/modules/ai-intel/veille/sort";
import type { VeilleItem } from "@/modules/ai-intel/veille/types";

function normalizeItem(row: Record<string, unknown>): VeilleItem {
  return {
    id: String(row.id),
    feed_date: String(row.feed_date),
    category: row.category as VeilleItem["category"],
    provider: row.provider as VeilleItem["provider"],
    severity: row.severity as VeilleItem["severity"],
    title: String(row.title),
    summary: String(row.summary),
    quoi: String(row.quoi ?? ""),
    impact: String(row.impact ?? ""),
    link: String(row.link),
    affected_versions: Array.isArray(row.affected_versions)
      ? (row.affected_versions as string[])
      : [],
    fixed_versions: Array.isArray(row.fixed_versions)
      ? (row.fixed_versions as string[])
      : [],
    stars_week:
      row.stars_week === null || row.stars_week === undefined
        ? null
        : Number(row.stars_week),
    stars_month:
      row.stars_month === null || row.stars_month === undefined
        ? null
        : Number(row.stars_month),
    price_info:
      row.price_info === null || row.price_info === undefined
        ? null
        : String(row.price_info),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

async function attachSaves(
  userId: string,
  items: VeilleItem[],
): Promise<VeilleItem[]> {
  if (items.length === 0) return items;
  const supabase = await createClient();
  const { data: saves } = await supabase
    .from("veille_ia_saves")
    .select("item_id")
    .eq("user_id", userId);

  const savedIds = new Set((saves ?? []).map((s) => s.item_id as string));
  return items.map((item) => ({ ...item, saved: savedIds.has(item.id) }));
}

export async function listVeilleFeedDates(limit = 60): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("veille_ia_items")
    .select("feed_date")
    .order("feed_date", { ascending: false });

  if (error) {
    if (/veille_ia_items|schema cache|does not exist/i.test(error.message)) {
      return [];
    }
    throw new Error(error.message);
  }

  const out: string[] = [];
  const seen = new Set<string>();
  for (const row of data ?? []) {
    const day = String(row.feed_date);
    if (seen.has(day)) continue;
    seen.add(day);
    out.push(day);
    if (out.length >= limit) break;
  }
  return out;
}

export async function getVeilleItemsRecent(
  userId: string,
  maxDays = 45,
): Promise<{ items: VeilleItem[]; days: string[] }> {
  const days = await listVeilleFeedDates(maxDays);
  if (days.length === 0) {
    return { items: [], days: [] };
  }
  const oldest = days[days.length - 1]!;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("veille_ia_items")
    .select("*")
    .gte("feed_date", oldest)
    .order("feed_date", { ascending: false });

  if (error) {
    if (/veille_ia_items|schema cache|does not exist/i.test(error.message)) {
      return { items: [], days };
    }
    throw new Error(error.message);
  }

  const items = (data ?? []).map((row) =>
    normalizeItem(row as Record<string, unknown>),
  );
  const withSaves = await attachSaves(userId, items);
  return { items: withSaves, days };
}

export async function getVeilleFeed(
  userId: string,
  feedDate: string,
): Promise<VeilleItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("veille_ia_items")
    .select("*")
    .eq("feed_date", feedDate)
    .limit(500);

  if (error) {
    if (/veille_ia_items|schema cache|does not exist/i.test(error.message)) {
      return [];
    }
    throw new Error(error.message);
  }

  const items = (data ?? []).map((row) =>
    normalizeItem(row as Record<string, unknown>),
  );
  const withSaves = await attachSaves(userId, items);
  return sortVeilleItems(withSaves);
}

/** Latest feed day with at least one row, or today if empty. */
export async function resolveDefaultVeilleDay(): Promise<string> {
  const days = await listVeilleFeedDates(1);
  return days[0] ?? toDayKey(new Date());
}

export async function getVeilleItemById(
  userId: string,
  itemId: string,
): Promise<VeilleItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("veille_ia_items")
    .select("*")
    .eq("id", itemId)
    .maybeSingle();

  if (error) {
    if (/veille_ia_items|schema cache|does not exist/i.test(error.message)) {
      return null;
    }
    throw new Error(error.message);
  }
  if (!data) return null;
  const [withSave] = await attachSaves(userId, [
    normalizeItem(data as Record<string, unknown>),
  ]);
  return withSave ?? null;
}

export async function getVeilleCriticalForDay(
  userId: string,
  feedDate: string,
): Promise<VeilleItem[]> {
  const feed = await getVeilleFeed(userId, feedDate);
  return feed.filter(
    (item) => item.severity === "critique" || item.category === "securite",
  );
}
