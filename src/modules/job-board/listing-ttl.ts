/** Offers last seen longer ago than this leave the shared pool. */
export const JOB_LISTING_TTL_DAYS = 30;

const DAY_MS = 86_400_000;

export function isStaleJobListing(scrapedAt: string, now = Date.now()): boolean {
  const t = Date.parse(scrapedAt);
  if (!Number.isFinite(t)) return true;
  return now - t > JOB_LISTING_TTL_DAYS * DAY_MS;
}

export function listingTtlCutoffIso(now = Date.now()): string {
  return new Date(now - JOB_LISTING_TTL_DAYS * DAY_MS).toISOString();
}
