import type { VeilleItem } from "./types";

/** Most recent feed_date present in items (YYYY-MM-DD), or null. */
export function latestVeilleFeedDay(items: Pick<VeilleItem, "feed_date">[]): string | null {
  if (items.length === 0) return null;
  return items.reduce((max, item) => (item.feed_date > max ? item.feed_date : max), items[0]!.feed_date);
}

export function collectVeilleDays(items: Pick<VeilleItem, "feed_date">[]): string[] {
  const days: string[] = [];
  const seen = new Set<string>();
  for (const item of [...items].sort((a, b) => b.feed_date.localeCompare(a.feed_date))) {
    if (!seen.has(item.feed_date)) {
      seen.add(item.feed_date);
      days.push(item.feed_date);
    }
  }
  return days;
}
