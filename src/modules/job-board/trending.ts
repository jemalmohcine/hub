import { daysBetween } from "@/lib/dates";
import type { JobListing } from "@/modules/job-board/types";

/** Higher = a source that actually produces landable offers. */
export const JOB_SOURCE_QUALITY: Record<string, number> = {
  wttj: 90,
  remotive: 86,
  wwr: 84,
  himalayas: 80,
  arbeitnow: 72,
  jobicy: 68,
  "indeed-fr": 52,
};

const TRENDING_DAYS = 2;
const FRESH_DAYS = 7;

export function listingAgeDays(
  listing: Pick<JobListing, "publishedAt" | "scrapedAt">,
  now = Date.now(),
): number {
  const raw = listing.publishedAt || listing.scrapedAt;
  if (!raw) return 99;
  return Math.max(0, daysBetween(raw, now));
}

export function isTrendingListing(
  listing: Pick<JobListing, "source" | "publishedAt" | "scrapedAt">,
  now = Date.now(),
): boolean {
  const quality = JOB_SOURCE_QUALITY[listing.source] ?? 0;
  if (quality < 70) return false;
  return listingAgeDays(listing, now) <= TRENDING_DAYS;
}

/** Recency + source quality — never larger than a real title/CV match. */
export function listingHeatScore(
  listing: Pick<JobListing, "source" | "publishedAt" | "scrapedAt">,
  now = Date.now(),
): number {
  const age = listingAgeDays(listing, now);
  const quality = JOB_SOURCE_QUALITY[listing.source] ?? 40;
  let heat = 0;
  if (age <= TRENDING_DAYS) heat += 12;
  else if (age <= FRESH_DAYS) heat += 6;
  if (age <= FRESH_DAYS) heat += Math.round(quality / 20);
  return heat;
}
