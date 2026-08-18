import { describe, expect, it } from "vitest";
import {
  timestampsForInsert,
  timestampsForUpdate,
  isFreshPushAlert,
} from "@/modules/ai-intel/item-timestamps";

const scrapeDay = "2026-08-17T12:00:00.000Z";

describe("timestampsForInsert", () => {
  it("keeps the source publication date when the collector has one", () => {
    expect(
      timestampsForInsert("2026-08-14T09:30:00.000Z", scrapeDay),
    ).toEqual({
      published_at: "2026-08-14T09:30:00.000Z",
      ingested_at: scrapeDay,
    });
  });

  it("falls back to the scrape day when the source has no date", () => {
    expect(timestampsForInsert(null, scrapeDay)).toEqual({
      published_at: scrapeDay,
      ingested_at: scrapeDay,
    });
    expect(timestampsForInsert("", scrapeDay).published_at).toBe(scrapeDay);
  });
});

describe("timestampsForUpdate", () => {
  it("only refreshes ingested_at when the collector has no date", () => {
    expect(timestampsForUpdate(scrapeDay)).toEqual({
      ingested_at: scrapeDay,
    });
    expect(timestampsForUpdate(scrapeDay, null)).not.toHaveProperty(
      "published_at",
    );
  });

  it("does not treat a collector “now” as a new publication date", () => {
    expect(
      timestampsForUpdate(scrapeDay, "2026-08-17T08:11:00.000Z"),
    ).toEqual({ ingested_at: scrapeDay });
  });

  it("restores a real source date that an older scrape overwrote", () => {
    expect(
      timestampsForUpdate(scrapeDay, "2026-08-14T09:30:00.000Z"),
    ).toEqual({
      ingested_at: scrapeDay,
      published_at: "2026-08-14T09:30:00.000Z",
    });
  });
});

describe("isFreshPushAlert", () => {
  const now = Date.parse("2026-08-18T10:00:00.000Z");

  it("allows a story published a few hours ago", () => {
    expect(isFreshPushAlert("2026-08-18T08:00:00.000Z", now)).toBe(true);
  });

  it("blocks a story from yesterday", () => {
    expect(isFreshPushAlert("2026-08-17T09:00:00.000Z", now)).toBe(false);
  });

  it("blocks yesterday evening even when it is still within 24 hours", () => {
    expect(isFreshPushAlert("2026-08-17T22:00:00.000Z", now)).toBe(false);
  });

  it("treats a missing source date as just seen", () => {
    expect(isFreshPushAlert(null, now)).toBe(true);
    expect(isFreshPushAlert("", now)).toBe(true);
  });
});
