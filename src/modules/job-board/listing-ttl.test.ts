import { describe, expect, it } from "vitest";
import {
  JOB_LISTING_TTL_DAYS,
  isExpiredJobOffer,
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

describe("isExpiredJobOffer", () => {
  const now = Date.parse("2026-08-20T12:00:00.000Z");

  it("drops a listing published more than 30 days ago even if re-scraped today", () => {
    expect(
      isExpiredJobOffer(
        { publishedAt: "2026-07-10T12:00:00.000Z", scrapedAt: "2026-08-20T12:00:00.000Z" },
        "2026-08-20T12:00:00.000Z",
        now,
      ),
    ).toBe(true);
  });

  it("drops another user's fresh scrape when this user last collected it 31 days ago", () => {
    expect(
      isExpiredJobOffer(
        { publishedAt: "2026-08-18T12:00:00.000Z", scrapedAt: "2026-08-20T12:00:00.000Z" },
        "2026-07-20T12:00:00.000Z",
        now,
      ),
    ).toBe(true);
  });

  it("keeps a listing published and collected this week", () => {
    expect(
      isExpiredJobOffer(
        { publishedAt: "2026-08-18T12:00:00.000Z", scrapedAt: "2026-08-19T12:00:00.000Z" },
        "2026-08-19T12:00:00.000Z",
        now,
      ),
    ).toBe(false);
  });
});
