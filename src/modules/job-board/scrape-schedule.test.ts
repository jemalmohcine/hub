import { describe, expect, it } from "vitest";
import { jobScrapeIsDue } from "@/modules/job-board/scrape-schedule";

function localDay(year: number, month: number, day: number, hour = 12): Date {
  return new Date(year, month - 1, day, hour, 0, 0, 0);
}

describe("jobScrapeIsDue", () => {
  const today = localDay(2026, 8, 20, 12);

  it("is due when the user has never collected offers", () => {
    expect(jobScrapeIsDue(null, today)).toBe(true);
    expect(jobScrapeIsDue(undefined, today)).toBe(true);
    expect(jobScrapeIsDue("", today)).toBe(true);
  });

  it("is not due again the same calendar day", () => {
    expect(jobScrapeIsDue(localDay(2026, 8, 20, 8).toISOString(), today)).toBe(false);
  });

  it("is due the next day they open the app", () => {
    expect(jobScrapeIsDue(localDay(2026, 8, 19, 23).toISOString(), today)).toBe(true);
  });
});
