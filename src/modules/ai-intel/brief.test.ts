import { describe, expect, it } from "vitest";
import { explainTitle, resolveBrief } from "@/modules/ai-intel/brief";
import type { AiIntelItem } from "@/modules/ai-intel/types";

function item(overrides: Partial<AiIntelItem> = {}): AiIntelItem {
  return {
    id: "1",
    canonical_key: "k",
    pillar: "tools",
    category: "software",
    urgency: "light",
    title: "Some AI story",
    summary: "",
    url: "https://example.com",
    primary_source: "openai-changelog",
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

describe("explainTitle", () => {
  it("drops changelog chrome and keeps a useful fact", () => {
    const explained = explainTitle(
      item({
        title: "Back to changelog",
        metadata: {
          contentKind: "feature",
          purpose: "Copilot Agent peut maintenant lancer des tests dans le terminal.",
        },
      }),
      "fr",
    );

    expect(explained.title.toLowerCase()).not.toContain("back to changelog");
    expect(explained.title).toContain("Copilot");
    expect(explained.title).toMatch(/tests|terminal/i);
  });

  it("uses a short organized title when it is already clean", () => {
    const explained = explainTitle(
      item({
        title: "OpenAI pricing",
        metadata: {
          contentKind: "pricing",
          organizedTitle: "OpenAI : GPT-4o coûte 20 % plus cher",
        },
      }),
      "fr",
    );

    expect(explained.title).toBe("OpenAI : GPT-4o coûte 20 % plus cher");
  });
});

describe("resolveBrief", () => {
  it("summarises a repo with the tagline, not star counts in the title", () => {
    const brief = resolveBrief(
      item({
        pillar: "opensource",
        title: "user/draco",
        primary_source: "github-trending",
        metadata: {
          kind: "repo",
          contentKind: "repo",
          tagline: "Scraper local en Rust, drop-in de Firecrawl.",
          stars: 1200,
          starsToday: 240,
        },
      }),
      "fr",
    );

    expect(brief.title.toLowerCase()).toContain("draco");
    expect(brief.title.toLowerCase()).not.toMatch(/\d+\s*stars?/);
    expect(brief.tldr).toMatch(/rust|scraper|firecrawl/i);
  });
});
