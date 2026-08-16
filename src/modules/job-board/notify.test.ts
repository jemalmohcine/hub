import { describe, expect, it } from "vitest";
import { followUpCopy, isFreshListing, newMatchesCopy } from "@/modules/job-board/notify";

describe("job notify copy", () => {
  it("pluralizes new matches", () => {
    expect(newMatchesCopy(1, "Frontend").title).toBe("Une nouvelle offre pour toi");
    expect(newMatchesCopy(4, "Frontend").title).toBe("4 nouvelles offres pour toi");
  });

  it("pluralizes follow-ups", () => {
    expect(followUpCopy(1).title).toBe("Une relance aujourd’hui");
    expect(followUpCopy(3).title).toBe("3 relances aujourd’hui");
  });
});

describe("isFreshListing", () => {
  const now = Date.parse("2026-08-16T12:00:00.000Z");

  it("keeps a listing scraped 2 hours ago", () => {
    expect(isFreshListing({ scrapedAt: "2026-08-16T10:00:00.000Z" }, now)).toBe(true);
  });

  it("drops a listing scraped yesterday", () => {
    expect(isFreshListing({ scrapedAt: "2026-08-15T10:00:00.000Z" }, now)).toBe(false);
  });
});
