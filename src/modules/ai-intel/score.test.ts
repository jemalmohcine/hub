import { describe, expect, it } from "vitest";
import { isWorthKeeping, preEnrichPriority } from "@/modules/ai-intel/score";
import type { ClassifiedItem } from "@/modules/ai-intel/types";

function item(overrides: Partial<ClassifiedItem> = {}): ClassifiedItem {
  return {
    canonicalKey: "key",
    pillar: "tools",
    category: "general",
    urgency: "light",
    title: "Some AI story",
    summary: "",
    url: "https://example.com",
    primarySource: "hn-ai",
    sourceRefs: [],
    publishedAt: null,
    metadata: {},
    ...overrides,
  } as ClassifiedItem;
}

describe("preEnrichPriority", () => {
  it("puts a security advisory ahead of an ordinary story", () => {
    const advisory = item({
      title: "CVE-2026-1234: critical vulnerability in the OpenAI Node SDK",
      summary: "Patch immediately.",
    });
    const ordinary = item({ title: "Someone built a to-do app with an LLM" });

    expect(preEnrichPriority(advisory)).toBeGreaterThan(
      preEnrichPriority(ordinary),
    );
  });

  it("puts a deprecation ahead of an ordinary story", () => {
    const deprecation = item({
      title: "gpt-4o is deprecated and will be removed in June",
      summary: "Migrate to the new endpoint.",
    });
    expect(preEnrichPriority(deprecation)).toBeGreaterThan(
      preEnrichPriority(item({ title: "Weekly AI roundup" })),
    );
  });

  it("rewards a story confirmed by several sources", () => {
    const base = { title: "New agent framework released" };
    const single = item({ ...base, metadata: { confirmations: 1 } });
    const corroborated = item({ ...base, metadata: { confirmations: 3 } });

    expect(preEnrichPriority(corroborated)).toBeGreaterThan(
      preEnrichPriority(single),
    );
  });

  it("sorts a batch so urgent items are analysed first", () => {
    const batch = [
      item({ title: "Weekly AI roundup" }),
      item({ title: "Show HN: my weekend project" }),
      item({ title: "CVE-2026-9999 vulnerability in Next.js" }),
    ];
    const ordered = [...batch].sort(
      (a, b) => preEnrichPriority(b) - preEnrichPriority(a),
    );
    expect(ordered[0].title).toContain("CVE-2026-9999");
  });
});

describe("isWorthKeeping", () => {
  it("always keeps action-required items regardless of score", () => {
    expect(isWorthKeeping({ hardSignal: "security", score: 5 })).toBe(true);
    expect(isWorthKeeping({ actionRequired: true, score: 0 })).toBe(true);
  });

  it("drops clear noise", () => {
    expect(isWorthKeeping({ verdict: "skip", score: 20 })).toBe(false);
  });

  it("keeps a story corroborated by a second source at a lower bar", () => {
    expect(isWorthKeeping({ score: 37 }, 1)).toBe(false);
    expect(isWorthKeeping({ score: 37 }, 2)).toBe(true);
  });
});
