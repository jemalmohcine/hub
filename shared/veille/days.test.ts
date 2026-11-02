import { describe, expect, it } from "vitest";
import { filterVeilleAppFeedItems, filterVeilleLastSevenDays, veilleMaxVisibleFeedDay } from "./days";

describe("filterVeilleLastSevenDays", () => {
  it("includes feed_date one day ahead of hub today (ingest editorial date)", () => {
    const today = "2026-11-01";
    const max = veilleMaxVisibleFeedDay(today);
    expect(max).toBe("2026-11-02");
    const items = [{ feed_date: "2026-11-02" }];
    expect(filterVeilleLastSevenDays(items, today)).toHaveLength(1);
  });

  it("excludes feed_date more than one day ahead", () => {
    const today = "2026-11-01";
    expect(filterVeilleLastSevenDays([{ feed_date: "2026-11-03" }], today)).toHaveLength(0);
  });
});

describe("filterVeilleAppFeedItems", () => {
  it("keeps all dated rows for the full veille page", () => {
    const items = [
      { feed_date: "2025-01-01" },
      { feed_date: "2026-11-02" },
      { feed_date: "" },
    ];
    expect(filterVeilleAppFeedItems(items)).toHaveLength(2);
  });
});
