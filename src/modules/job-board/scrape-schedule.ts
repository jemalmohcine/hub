import { toDayKey } from "@/lib/dates";

/** True when there is no scrape yet, or the last one was on a previous calendar day. */
export function jobScrapeIsDue(
  lastScrapedAt: string | null | undefined,
  now: string | number | Date = Date.now(),
): boolean {
  const lastDay = toDayKey(lastScrapedAt);
  if (!lastDay) return true;
  const today = toDayKey(now);
  return lastDay < today;
}
