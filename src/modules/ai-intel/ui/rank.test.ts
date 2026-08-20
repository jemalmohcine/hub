import { describe, expect, it } from "vitest";
import type { AiIntelItem } from "@/modules/ai-intel/types";
import { isHotAlert, isNoise, isTrending } from "@/modules/ai-intel/ui/rank";

function item(overrides: Partial<AiIntelItem> = {}): AiIntelItem {
  return {
    id: "1",
    canonical_key: "k",
    pillar: "models",
    category: "general",
    urgency: "light",
    title: "Some AI story",
    summary: "",
    url: "https://example.com",
    primary_source: "hn-ai",
    source_refs: [],
    metadata: {},
    published_at: "2026-08-16T00:00:00.000Z",
    ingested_at: "2026-08-16T00:00:00.000Z",
    updated_at: "2026-08-16T00:00:00.000Z",
    saved: false,
    read: false,
    ...overrides,
  };
}

describe("isHotAlert", () => {
  it("marks a CVE / hard signal as urgent", () => {
    expect(
      isHotAlert(item({ metadata: { hardSignal: "security", contentKind: "security" } })),
    ).toBe(true);
  });

  it("marks a price change as urgent", () => {
    expect(
      isHotAlert(item({ metadata: { hardSignal: "pricing", contentKind: "pricing" } })),
    ).toBe(true);
  });

  it("marks a revolutionary tool as urgent", () => {
    expect(
      isHotAlert(
        item({
          pillar: "tools",
          urgency: "urgent",
          metadata: { kind: "tool", contentKind: "tool", actionRequired: true, score: 88 },
        }),
      ),
    ).toBe(true);
  });

  it("does not mark an exploding GitHub repo as urgent", () => {
    expect(
      isHotAlert(
        item({
          pillar: "opensource",
          metadata: { exploding: true, kind: "repo", contentKind: "repo" },
        }),
      ),
    ).toBe(false);
  });

  it("does not mark an outage as urgent", () => {
    expect(
      isHotAlert(item({ metadata: { hardSignal: "outage", contentKind: "news" } })),
    ).toBe(false);
  });

  it("does not mark a breaking changelog as urgent", () => {
    expect(
      isHotAlert(
        item({
          urgency: "urgent",
          metadata: {
            hardSignal: "breaking",
            contentKind: "breaking",
            actionRequired: true,
          },
        }),
      ),
    ).toBe(false);
  });

  it("does not mark a new model as urgent", () => {
    expect(
      isHotAlert(
        item({
          category: "new_model",
          urgency: "urgent",
          title: "OpenAI launches GPT-5",
          metadata: { contentKind: "model", score: 88 },
        }),
      ),
    ).toBe(false);
  });

  it("does not mark a merely trending repo as urgent", () => {
    expect(
      isHotAlert(
        item({
          pillar: "opensource",
          metadata: {
            kind: "repo",
            contentKind: "repo",
            starsToday: 180,
            stars: 12_000,
            rank: 8,
          },
        }),
      ),
    ).toBe(false);
  });

  it("does not treat a young repo gaining 10% of its stars today as urgent", () => {
    expect(
      isHotAlert(
        item({
          pillar: "opensource",
          metadata: {
            kind: "repo",
            starsToday: 400,
            stars: 900,
            rank: 1,
          },
        }),
      ),
    ).toBe(false);
  });
});

describe("isTrending", () => {
  it("flags a repo with strong daily growth that is not exploding", () => {
    expect(
      isTrending(
        item({
          pillar: "opensource",
          metadata: { kind: "repo", starsToday: 220, stars: 40_000, rank: 12 },
        }),
      ),
    ).toBe(true);
    expect(
      isHotAlert(
        item({
          pillar: "opensource",
          metadata: {
            kind: "repo",
            contentKind: "repo",
            starsToday: 220,
            stars: 40_000,
            rank: 12,
          },
        }),
      ),
    ).toBe(false);
  });

  it("flags every repo from the GitHub trending sources", () => {
    expect(
      isTrending(
        item({
          pillar: "opensource",
          primary_source: "github-trending",
          metadata: { kind: "repo", contentKind: "repo", starsToday: 40, stars: 800 },
        }),
      ),
    ).toBe(true);
    expect(
      isTrending(
        item({
          pillar: "opensource",
          primary_source: "gittrend",
          metadata: { kind: "repo", contentKind: "repo" },
        }),
      ),
    ).toBe(true);
  });

  it("does not flag a random repo that is not growing", () => {
    expect(
      isTrending(
        item({
          pillar: "opensource",
          primary_source: "hn-ai",
          metadata: { kind: "repo", contentKind: "repo", stars: 800, starsToday: 12 },
        }),
      ),
    ).toBe(false);
  });
});

describe("isNoise", () => {
  it("hides skip and low-score rows", () => {
    expect(isNoise(item({ metadata: { verdict: "skip", score: 80 } }))).toBe(true);
    expect(isNoise(item({ metadata: { score: 30 } }))).toBe(true);
    expect(isNoise(item({ metadata: { score: 70, verdict: "use_it" } }))).toBe(false);
  });
});
