import { describe, expect, it } from "vitest";
import type { AiIntelItem } from "@/modules/ai-intel/types";
import {
  currentYearRange,
  unreadUrgentsInRange,
} from "@/modules/ai-intel/unread-urgents";

function item(overrides: Partial<AiIntelItem> = {}): AiIntelItem {
  return {
    id: "1",
    canonical_key: "k",
    pillar: "models",
    category: "security",
    urgency: "urgent",
    title: "CVE in a popular SDK",
    summary: "",
    url: "https://example.com/cve",
    primary_source: "openai-changelog",
    source_refs: [],
    metadata: { hardSignal: "security", contentKind: "security" },
    published_at: "2026-08-17T09:00:00.000Z",
    ingested_at: "2026-08-19T12:00:00.000Z",
    updated_at: "2026-08-19T12:00:00.000Z",
    saved: false,
    read: false,
    ...overrides,
  };
}

describe("unreadUrgentsInRange", () => {
  const year = { from: "2026-01-01", to: "2026-08-19" };

  it("counts an unread urgent from earlier this year", () => {
    expect(unreadUrgentsInRange([item()], year.from, year.to)).toHaveLength(1);
  });

  it("skips treated alerts", () => {
    expect(
      unreadUrgentsInRange([item({ read: true })], year.from, year.to),
    ).toHaveLength(0);
  });

  it("skips a non-urgent story", () => {
    expect(
      unreadUrgentsInRange(
        [item({ metadata: { contentKind: "news" }, urgency: "light" })],
        year.from,
        year.to,
      ),
    ).toHaveLength(0);
  });

  it("skips last year’s urgent", () => {
    expect(
      unreadUrgentsInRange(
        [item({ published_at: "2025-12-31T12:00:00.000Z" })],
        year.from,
        year.to,
      ),
    ).toHaveLength(0);
  });
});

describe("currentYearRange", () => {
  it("starts on 1 January of the given day", () => {
    expect(currentYearRange(new Date(2026, 7, 19, 10, 0, 0))).toEqual({
      from: "2026-01-01",
      to: "2026-08-19",
    });
  });
});
