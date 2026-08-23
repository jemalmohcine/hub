/** Offers older than this leave each user's list, then the shared pool. */
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

/**
 * Drop an offer for a user when it was published more than 30 days ago,
 * or when that user last collected it more than 30 days ago.
 */
export function isExpiredJobOffer(
  listing: { publishedAt?: string | null; scrapedAt?: string | null },
  attachedAt?: string | null,
  now = Date.now(),
): boolean {
  if (attachedAt && isStaleJobListing(attachedAt, now)) return true;
  if (listing.publishedAt) return isStaleJobListing(listing.publishedAt, now);
  if (listing.scrapedAt) return isStaleJobListing(listing.scrapedAt, now);
  return false;
}
