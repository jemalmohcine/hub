import { describe, expect, it } from "vitest";
import { isEssentialAiIntelUrl } from "@/modules/ai-intel/essential-hosts";

describe("isEssentialAiIntelUrl", () => {
  it("accepts vendor article and status hosts", () => {
    expect(isEssentialAiIntelUrl("https://openai.com/news/gpt-5")).toBe(true);
    expect(isEssentialAiIntelUrl("https://status.openai.com/incidents/abc")).toBe(true);
    expect(isEssentialAiIntelUrl("https://www.cursor.com/changelog/2-0")).toBe(true);
    expect(isEssentialAiIntelUrl("https://github.blog/changelog/copilot")).toBe(true);
    expect(isEssentialAiIntelUrl("https://simonwillison.net/2026/aug/15/llm")).toBe(true);
    expect(isEssentialAiIntelUrl("https://developer.nvidia.com/blog/foo")).toBe(true);
  });

  it("rejects aggregators, GitHub repos and press we demoted", () => {
    expect(isEssentialAiIntelUrl("https://github.com/vercel/next.js")).toBe(false);
    expect(isEssentialAiIntelUrl("https://news.ycombinator.com/item?id=1")).toBe(false);
    expect(isEssentialAiIntelUrl("https://techcrunch.com/ai/foo")).toBe(false);
    expect(isEssentialAiIntelUrl("https://futuretools.io/tools/foo")).toBe(false);
    expect(isEssentialAiIntelUrl("not-a-url")).toBe(false);
  });
});
