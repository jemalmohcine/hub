import { describe, expect, it } from "vitest";
import { isTrendingListing, listingHeatScore } from "@/modules/job-board/trending";

describe("isTrendingListing", () => {
  const now = Date.parse("2026-08-16T12:00:00.000Z");

  it("flags a fresh WTTJ offer", () => {
    expect(
      isTrendingListing(
        {
          source: "wttj",
          publishedAt: "2026-08-15T12:00:00.000Z",
          scrapedAt: "2026-08-16T10:00:00.000Z",
        },
        now,
      ),
    ).toBe(true);
  });

  it("ignores an old Indeed dump", () => {
    expect(
      isTrendingListing(
        {
          source: "indeed-fr",
          publishedAt: "2026-08-15T12:00:00.000Z",
          scrapedAt: "2026-08-16T10:00:00.000Z",
        },
        now,
      ),
    ).toBe(false);
  });
});

describe("listingHeatScore", () => {
  const now = Date.parse("2026-08-16T12:00:00.000Z");

  it("boosts a 1-day-old Remotive offer more than a 3-week-old one", () => {
    const hot = listingHeatScore(
      {
        source: "remotive",
        publishedAt: "2026-08-15T12:00:00.000Z",
        scrapedAt: "2026-08-15T12:00:00.000Z",
      },
      now,
    );
    const cold = listingHeatScore(
      {
        source: "remotive",
        publishedAt: "2026-07-20T12:00:00.000Z",
        scrapedAt: "2026-07-20T12:00:00.000Z",
      },
      now,
    );
    expect(hot).toBeGreaterThan(cold);
    expect(cold).toBe(0);
  });
});
