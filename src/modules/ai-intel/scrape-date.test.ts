import { describe, expect, it } from "vitest";
import { scrapeDayIso } from "@/modules/ai-intel/scrape-date";

describe("scrapeDayIso", () => {
  it("pins the digest to UTC noon on the scrape calendar day", () => {
    expect(scrapeDayIso(new Date("2026-08-13T06:00:00.000Z"))).toBe(
      "2026-08-13T12:00:00.000Z",
    );
  });

  it("does not roll to the previous day just after midnight UTC", () => {
    expect(scrapeDayIso(new Date("2026-08-13T00:15:00.000Z"))).toBe(
      "2026-08-13T12:00:00.000Z",
    );
  });

  it("stays on the same UTC day in the evening so a late catch-up is still today", () => {
    expect(scrapeDayIso(new Date("2026-08-13T21:00:00.000Z"))).toBe(
      "2026-08-13T12:00:00.000Z",
    );
  });
});
