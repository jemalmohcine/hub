import { describe, expect, it } from "vitest";
import { detectContentKind, productOf } from "@/modules/ai-intel/content-kind";
import type { AiIntelItem } from "@/modules/ai-intel/types";

type ItemLike = Pick<
  AiIntelItem,
  "title" | "summary" | "pillar" | "category" | "metadata" | "primary_source"
>;

function item(overrides: Partial<ItemLike> = {}): ItemLike {
  return {
    title: "",
    summary: "",
    pillar: "tools",
    category: "general",
    metadata: {},
    primary_source: "hn-ai",
    ...overrides,
  };
}

describe("productOf", () => {
  it("does not turn an aggregator into a product", () => {
    // A Rust scraper posted on Hacker News is not a "Hacker News" product.
    expect(productOf(item({ primary_source: "hn-ai" }))).toBeNull();
    expect(productOf(item({ primary_source: "tldr-ai" }))).toBeNull();
    expect(productOf(item({ primary_source: "github-trending" }))).toBeNull();
    expect(productOf(item({ primary_source: "futuretools" }))).toBeNull();
  });

  it("still names the vendor on a first-party feed", () => {
    expect(productOf(item({ primary_source: "vercel-blog" }))).toBe("Vercel");
    expect(productOf(item({ primary_source: "cursor-changelog" }))).toBe("Cursor");
  });

  it("prefers a product named in the title", () => {
    expect(
      productOf(item({ title: "Claude Code ships subagents", primary_source: "hn-ai" })),
    ).toBe("Claude Code");
  });
});

describe("detectContentKind", () => {
  it("classifies a self-hosted scraper as a tool, not an LLM model", () => {
    const draco = item({
      title: "Draco: a Rust web scraper",
      summary:
        "Draco is a faster, cheaper drop-in replacement for Firecrawl, written in Rust, that you self-host with a built in MCP.",
      // The classifier had wrongly tagged this story as a new model.
      category: "new_model",
      pillar: "tools",
    });
    expect(detectContentKind(draco)).toBe("tool");
  });

  it("still recognises a real model release", () => {
    const release = item({
      title: "Introducing Claude 4 Opus",
      summary: "A new frontier model with a larger context window.",
      pillar: "models",
      category: "new_model",
      primary_source: "anthropic-status",
    });
    expect(detectContentKind(release)).toBe("model");
  });

  it("trusts the kind decided while reading the scraped content", () => {
    expect(
      detectContentKind(item({ metadata: { contentKind: "security" } })),
    ).toBe("security");
  });

  it("keeps urgent kinds ahead of everything else", () => {
    expect(
      detectContentKind(item({ title: "CVE-2026-1234 in the OpenAI SDK" })),
    ).toBe("security");
    expect(
      detectContentKind(item({ title: "Gemini API pricing increase in March" })),
    ).toBe("pricing");
    expect(
      detectContentKind(item({ title: "gpt-4o is deprecated and will be removed" })),
    ).toBe("breaking");
  });
});
