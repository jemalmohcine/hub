/**
 * published_at is the source date, or the first scrape that saw the item.
 * ingested_at is the last scrape that still listed it.
 *
 * Never bump published_at to “today” on refresh — that made yesterday’s items
 * look new (the feed defaults to the current day).
 */
export function timestampsForInsert(
  publishedAt: string | null | undefined,
  scrapeDay: string,
): { published_at: string; ingested_at: string } {
  return {
    published_at: publishedAt || scrapeDay,
    ingested_at: scrapeDay,
  };
}

function sameUtcDay(iso: string, scrapeDay: string): boolean {
  return iso.slice(0, 10) === scrapeDay.slice(0, 10);
}

export function timestampsForUpdate(
  scrapeDay: string,
  sourcePublishedAt?: string | null,
): { ingested_at: string; published_at?: string } {
  const next: { ingested_at: string; published_at?: string } = {
    ingested_at: scrapeDay,
  };
  // Restore a real source date that was overwritten by a previous scrape.
  // Ignore “now” from collectors that don’t know the date (GitHub trending).
  if (sourcePublishedAt && !sameUtcDay(sourcePublishedAt, scrapeDay)) {
    next.published_at = sourcePublishedAt;
  }
  return next;
}
