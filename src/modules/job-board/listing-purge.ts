import { createAdminClient } from "@/core/auth/supabase/admin";
import { listingTtlCutoffIso } from "@/modules/job-board/listing-ttl";

export type JobOfferPurgeStats = {
  userRows: number;
  listings: number;
};

async function deleteOlderThan(
  table: "job_user_listings" | "job_listings",
  column: "scraped_at" | "published_at",
  cutoff: string,
  userId?: string,
): Promise<number> {
  const admin = createAdminClient();
  let query = admin.from(table).delete({ count: "exact" }).lt(column, cutoff);
  if (userId && table === "job_user_listings") {
    query = query.eq("user_id", userId);
  }
  const { error, count } = await query;
  if (error) {
    console.warn(`[jobs] purge ${table}.${column}`, error.message);
    return 0;
  }
  return count ?? 0;
}

/** Drop one user's collected offers last seen more than 30 days ago. */
export async function purgeExpiredUserOffers(userId: string): Promise<number> {
  return deleteOlderThan(
    "job_user_listings",
    "scraped_at",
    listingTtlCutoffIso(),
    userId,
  );
}

/**
 * Cron: drop shared listings older than 30 days, then each user's stale rows.
 * Pass `userId` to limit attachment cleanup after that person's scrape.
 */
export async function purgeExpiredJobOffers(userId?: string): Promise<JobOfferPurgeStats> {
  const cutoff = listingTtlCutoffIso();
  const published = await deleteOlderThan("job_listings", "published_at", cutoff);
  const scraped = await deleteOlderThan("job_listings", "scraped_at", cutoff);
  const userRows = await deleteOlderThan("job_user_listings", "scraped_at", cutoff, userId);
  return { userRows, listings: published + scraped };
}
