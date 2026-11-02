import type { VeilleItem } from "./types";
import { addDaysIso, hubDayKey, toDayKey } from "../lib/dates";

/** Most recent feed_date present in items (YYYY-MM-DD), or null. */
export function latestVeilleFeedDay(items: Pick<VeilleItem, "feed_date">[]): string | null {
  if (items.length === 0) return null;
  return items.reduce((max, item) => (item.feed_date > max ? item.feed_date : max), items[0]!.feed_date);
}

/** Default veille window: last 7 calendar days including today (matches Next `7d` preset). */
export function veilleSevenDayCutoff(today = hubDayKey()): string {
  return addDaysIso(today, -6);
}

/** Ingest may tag an editorial day slightly ahead of hub "today" (UTC vs Casablanca). */
export function veilleMaxVisibleFeedDay(today = hubDayKey()): string {
  return addDaysIso(today, 1);
}

export function filterVeilleLastSevenDays<T extends Pick<VeilleItem, "feed_date">>(
  items: T[],
  today = hubDayKey(),
): T[] {
  const cutoff = veilleSevenDayCutoff(today);
  const maxDay = veilleMaxVisibleFeedDay(today);
  return items.filter((item) => item.feed_date >= cutoff && item.feed_date <= maxDay);
}

/** Full veille page: show every row returned from the API (no rolling window). */
export function filterVeilleAppFeedItems<T extends Pick<VeilleItem, "feed_date">>(items: T[]): T[] {
  return items.filter((item) => Boolean(item.feed_date?.trim()));
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
