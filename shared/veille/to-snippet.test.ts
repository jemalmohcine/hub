import { describe, expect, it } from "vitest";
import { buildVeilleSnippetContent, buildVeilleSnippetTags, normalizeSnippetReferenceUrl } from "./to-snippet";
import type { VeilleItem } from "./types";

const sample: VeilleItem = {
  id: "1",
  feed_date: "2026-11-03",
  category: "securite",
  provider: "anthropic",
  severity: "elevee",
  title: "Correctif API",
  summary: "Résumé court.",
  quoi: "",
  impact: "• Risque sur les clés",
  link: "https://example.com/post/",
  affected_versions: [],
  fixed_versions: [],
  stars_week: null,
  stars_month: null,
  price_info: null,
  tags: [],
  created_at: "",
  updated_at: "",
};

describe("normalizeSnippetReferenceUrl", () => {
  it("strips trailing slash and hash", () => {
    expect(normalizeSnippetReferenceUrl("https://example.com/post/#x")).toBe("https://example.com/post");
  });
});

describe("buildVeilleSnippetContent", () => {
  it("includes link, summary and impact", () => {
    const body = buildVeilleSnippetContent(sample);
    expect(body).toContain("https://example.com/post/");
    expect(body).toContain("Résumé court.");
    expect(body).toContain("Impact");
    expect(body).toContain("Risque sur les clés");
  });
});

describe("buildVeilleSnippetTags", () => {
  it("adds veille, category and provider labels", () => {
    expect(buildVeilleSnippetTags(sample)).toEqual(["veille", "Sécurité", "Anthropic"]);
  });
});
