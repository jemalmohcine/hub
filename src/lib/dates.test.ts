import { describe, expect, it } from "vitest";
import {
  daysBetween,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  toDate,
  toDayKey,
  toMonthKey,
} from "@/lib/dates";

const ISO = "2026-08-07T14:30:00.000Z";

describe("toDate", () => {
  it("returns null for empty and invalid input", () => {
    expect(toDate(null)).toBeNull();
    expect(toDate(undefined)).toBeNull();
    expect(toDate("")).toBeNull();
    expect(toDate("not-a-date")).toBeNull();
  });

  it("passes through valid dates", () => {
    expect(toDate(ISO)?.toISOString()).toBe(ISO);
  });
});

describe("formatDate", () => {
  it("returns an empty string rather than 'Invalid Date'", () => {
    expect(formatDate(null, "fr")).toBe("");
    expect(formatDate("nope", "en")).toBe("");
  });

  it("formats per locale", () => {
    expect(formatDate(ISO, "fr", "short")).toBe("07/08/2026");
    expect(formatDate(ISO, "en", "short")).toBe("08/07/2026");
  });

  it("supports a month-year style for the expenses module", () => {
    expect(formatDate(ISO, "en", "monthYear")).toBe("August 2026");
  });
});

describe("formatDateTime", () => {
  it("includes hours and minutes", () => {
    expect(formatDateTime(ISO, "fr")).toMatch(/\d{2}\/\d{2}/);
    expect(formatDateTime(null, "fr")).toBe("");
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2026-08-07T12:00:00.000Z").getTime();
  const minutesAgo = (n: number) => new Date(now - n * 60_000).toISOString();

  it("collapses the first minute", () => {
    expect(formatRelativeTime(minutesAgo(0), "fr", now)).toBe("À l’instant");
    expect(formatRelativeTime(minutesAgo(0), "en", now)).toBe("Just now");
  });

  it("steps through minutes, hours and days", () => {
    expect(formatRelativeTime(minutesAgo(5), "fr", now)).toBe("Il y a 5 min");
    expect(formatRelativeTime(minutesAgo(60 * 3), "fr", now)).toBe("Il y a 3 h");
    expect(formatRelativeTime(minutesAgo(60 * 24 * 2), "fr", now)).toBe("Il y a 2 j");
  });

  it("falls back to a date past a week", () => {
    const old = new Date(now - 30 * 86_400_000).toISOString();
    expect(formatRelativeTime(old, "fr", now)).not.toMatch(/Il y a/);
  });
});

describe("day and month keys", () => {
  it("pads single digits", () => {
    expect(toDayKey(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(toMonthKey(new Date(2026, 0, 5))).toBe("2026-01");
  });

  it("returns an empty string for invalid input", () => {
    expect(toDayKey(null)).toBe("");
  });
});

describe("daysBetween", () => {
  it("counts whole days elapsed", () => {
    const from = "2026-08-01T00:00:00.000Z";
    const to = "2026-08-07T00:00:00.000Z";
    expect(daysBetween(from, to)).toBe(6);
  });

  it("is negative for future dates", () => {
    expect(daysBetween("2026-08-10T00:00:00.000Z", "2026-08-07T00:00:00.000Z")).toBeLessThan(0);
  });
});
