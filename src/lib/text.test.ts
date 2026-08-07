import { describe, expect, it } from "vitest";
import {
  clampField,
  collapseWhitespace,
  dedupeTexts,
  FIELD_LIMITS,
  foldCase,
  isNearDuplicate,
  truncateAtWord,
  truncateWithEllipsis,
} from "@/lib/text";

describe("truncateWithEllipsis", () => {
  it("leaves short text untouched", () => {
    expect(truncateWithEllipsis("hello", 10)).toBe("hello");
  });

  it("appends an ellipsis and never exceeds max", () => {
    const result = truncateWithEllipsis("abcdefghij", 5);
    expect(result).toBe("abcd…");
    expect(result.length).toBe(5);
  });

  it("trims surrounding whitespace first", () => {
    expect(truncateWithEllipsis("  spaced  ", 20)).toBe("spaced");
  });
});

describe("clampField", () => {
  it("cuts at the named limit without an ellipsis", () => {
    const long = "x".repeat(FIELD_LIMITS.title + 50);
    expect(clampField(long, "title")).toHaveLength(FIELD_LIMITS.title);
    expect(clampField(long, "title")).not.toContain("…");
  });

  it("handles null and undefined", () => {
    expect(clampField(null, "title")).toBe("");
    expect(clampField(undefined, "body")).toBe("");
  });
});

describe("collapseWhitespace", () => {
  it("normalises newlines, tabs and non-breaking spaces", () => {
    expect(collapseWhitespace("a \n\t b\u00a0c ")).toBe("a b c");
  });
});

describe("truncateAtWord", () => {
  it("never cuts inside a word", () => {
    const text = "Draco is a faster drop-in replacement for Firecrawl";
    const result = truncateAtWord(text, 20);
    expect(result.endsWith("…")).toBe(true);
    expect(text.startsWith(result.slice(0, -1))).toBe(true);
    expect(result.slice(0, -1).trim().split(" ").pop()).not.toBe("fas");
  });

  it("leaves short text alone", () => {
    expect(truncateAtWord("short", 20)).toBe("short");
  });

  it("drops trailing punctuation before the ellipsis", () => {
    expect(truncateAtWord("one, two, three, four", 12)).toBe("one, two…");
  });
});

describe("isNearDuplicate", () => {
  const sentence =
    "Draco is a faster, cheaper and lighter Firecrawl drop-in replacement.";

  it("matches text that differs only by punctuation or case", () => {
    expect(isNearDuplicate(sentence, sentence.toUpperCase())).toBe(true);
    expect(isNearDuplicate(sentence, sentence.replace(/[,.]/g, ""))).toBe(true);
  });

  it("matches a fragment contained in a longer block", () => {
    expect(isNearDuplicate("Draco is a faster", `${sentence} And more.`)).toBe(true);
  });

  it("does not match genuinely different content", () => {
    expect(
      isNearDuplicate(sentence, "Written in Rust with no headless browser."),
    ).toBe(false);
  });

  it("ignores empty input", () => {
    expect(isNearDuplicate("", sentence)).toBe(false);
  });
});

describe("dedupeTexts", () => {
  it("keeps the first occurrence of each distinct idea", () => {
    const a = "Draco replaces Firecrawl and runs on your machine.";
    const b = "Written in Rust, no headless browser required.";
    expect(dedupeTexts([a, a.toUpperCase(), b, "  "])).toEqual([a, b]);
  });
});

describe("foldCase", () => {
  it("strips accents and lowercases", () => {
    expect(foldCase("Déprécié")).toBe("deprecie");
    expect(foldCase("  ÉTÉ ")).toBe("ete");
  });
});
