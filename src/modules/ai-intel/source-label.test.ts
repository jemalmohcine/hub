import { describe, expect, it } from "vitest";
import { sourceDisplayName } from "@/modules/ai-intel/source-label";

describe("sourceDisplayName", () => {
  it("maps known collector ids to a public name", () => {
    expect(sourceDisplayName("hn-ai")).toBe("Hacker News");
    expect(sourceDisplayName("github-trending")).toBe("GitHub");
    expect(sourceDisplayName("tldr-ai")).toBe("TLDR");
  });

  it("title-cases unknown ids without pipeline suffixes", () => {
    expect(sourceDisplayName("cursor-changelog")).toBe("Cursor Changelog");
  });

  it("handles empty input", () => {
    expect(sourceDisplayName(null)).toBe("");
  });
});
