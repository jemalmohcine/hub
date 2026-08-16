import { describe, expect, it } from "vitest";
import {
  JOB_LISTING_TTL_DAYS,
  isStaleJobListing,
  listingTtlCutoffIso,
} from "@/modules/job-board/listing-ttl";

describe("isStaleJobListing", () => {
  const now = Date.parse("2026-08-16T12:00:00.000Z");

  it("keeps a listing seen this week", () => {
    expect(isStaleJobListing("2026-08-14T12:00:00.000Z", now)).toBe(false);
  });

  it(`drops a listing last seen more than ${JOB_LISTING_TTL_DAYS} days ago`, () => {
    expect(isStaleJobListing("2026-07-01T12:00:00.000Z", now)).toBe(true);
  });

  it("treats an unparseable date as stale", () => {
    expect(isStaleJobListing("not-a-date", now)).toBe(true);
  });

  it("cuts off exactly 30 days back", () => {
    const cutoff = listingTtlCutoffIso(now);
    expect(cutoff).toBe("2026-07-17T12:00:00.000Z");
  });
});
