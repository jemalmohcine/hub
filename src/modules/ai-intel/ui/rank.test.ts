import { describe, expect, it } from "vitest";
import type { AiIntelItem } from "@/modules/ai-intel/types";
import { isHotAlert, isNoise, isTrending, sortForDeveloper } from "@/modules/ai-intel/ui/rank";

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

  it("marks an LLM price change as urgent", () => {
    expect(
      isHotAlert(
        item({
          pillar: "models",
          title: "OpenAI raises GPT-4o prices",
          metadata: { hardSignal: "pricing", contentKind: "pricing" },
        }),
      ),
    ).toBe(true);
  });

  it("does not mark a random SaaS price change as urgent", () => {
    expect(
      isHotAlert(
        item({
          pillar: "tools",
          title: "Notion raises the Plus plan",
          metadata: { hardSignal: "pricing", contentKind: "pricing" },
        }),
      ),
    ).toBe(false);
  });

  it("marks a widely used exploding GitHub repo as urgent", () => {
    expect(
      isHotAlert(
        item({
          pillar: "opensource",
          metadata: {
            exploding: true,
            kind: "repo",
            contentKind: "repo",
            stars: 18_000,
            starsToday: 520,
          },
        }),
      ),
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

  it("does not mark an exploding GitHub repo as urgent when it is still small", () => {
    expect(
      isHotAlert(
        item({
          pillar: "opensource",
          metadata: { exploding: true, kind: "repo", contentKind: "repo", stars: 400 },
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

  it("flags a well-used repo from GitHub trending", () => {
    expect(
      isTrending(
        item({
          pillar: "opensource",
          primary_source: "github-trending",
          metadata: { kind: "repo", contentKind: "repo", starsToday: 40, stars: 8_000 },
        }),
      ),
    ).toBe(true);
    expect(
      isTrending(
        item({
          pillar: "opensource",
          primary_source: "gittrend",
          metadata: { kind: "repo", contentKind: "repo", stars: 3_200, starsToday: 90 },
        }),
      ),
    ).toBe(true);
  });

  it("does not flag a tiny github-trending repo", () => {
    expect(
      isTrending(
        item({
          pillar: "opensource",
          primary_source: "github-trending",
          metadata: { kind: "repo", contentKind: "repo", starsToday: 40, stars: 180 },
        }),
      ),
    ).toBe(false);
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

describe("sortForDeveloper", () => {
  it("keeps untreated urgents above treated ones", () => {
    const hot = { hardSignal: "security", contentKind: "security" };
    const open = item({ id: "open", metadata: hot, read: false });
    const treated = item({ id: "treated", metadata: hot, read: true });
    expect([treated, open].sort(sortForDeveloper).map((row) => row.id)).toEqual([
      "open",
      "treated",
    ]);
  });
});
