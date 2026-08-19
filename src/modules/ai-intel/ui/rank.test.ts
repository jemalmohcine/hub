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

  it("marks an exploding GitHub repo as urgent", () => {
    expect(
      isHotAlert(
        item({
          pillar: "opensource",
          metadata: { exploding: true, kind: "repo", contentKind: "repo" },
        }),
      ),
    ).toBe(true);
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

  it("treats a young repo gaining 10% of its stars today as urgent", () => {
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
    ).toBe(true);
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
    const hot = { exploding: true, kind: "repo", contentKind: "repo" };
    const open = item({ id: "open", metadata: hot, read: false });
    const treated = item({ id: "treated", metadata: hot, read: true });
    expect([treated, open].sort(sortForDeveloper).map((row) => row.id)).toEqual([
      "open",
      "treated",
    ]);
  });
});
