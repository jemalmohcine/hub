import { describe, expect, it } from "vitest";
import { normalizeForDedupe, slugify } from "@/lib/slug";

describe("slugify", () => {
  it("produces a filename-safe slug", () => {
    expect(slugify("CV — Mohcine Jemal (2026)")).toBe("cv-mohcine-jemal-2026");
  });

  it("strips accents", () => {
    expect(slugify("Dépenses dev")).toBe("depenses-dev");
  });

  it("falls back when nothing survives", () => {
    expect(slugify("!!!")).toBe("item");
    expect(slugify("", "cv")).toBe("cv");
  });
});

describe("normalizeForDedupe", () => {
  it("matches titles that differ only by punctuation or case", () => {
    expect(normalizeForDedupe("OpenAI: GPT-5 released!")).toBe(
      normalizeForDedupe("openai gpt 5 released"),
    );
  });
});
