import { describe, expect, it } from "vitest";
import { buildItemDetail } from "@/modules/ai-intel/item-detail";
import type { AiIntelItem } from "@/modules/ai-intel/types";

/** The sentence that used to appear as title, summary and first bullet. */
const DRACO =
  "Draco is a faster, cheaper and lighter firecrawl drop-in replacement that you own entirely, running on your machine, with a built in MCP and free websearch.";

function item(overrides: Partial<AiIntelItem> = {}): AiIntelItem {
  return {
    id: "item-1",
    canonical_key: "draco",
    pillar: "opensource",
    category: "trending_repo",
    urgency: "medium",
    title: "draco",
    summary: DRACO,
    url: "https://github.com/user/draco",
    primary_source: "hn-ai",
    sources: [],
    published_at: "2026-08-07T10:00:00.000Z",
    ingested_at: "2026-08-07T11:00:00.000Z",
    metadata: {},
    read: false,
    saved: false,
    ...overrides,
  } as AiIntelItem;
}

function sectionIds(detail: ReturnType<typeof buildItemDetail>) {
  return detail.sections.map((section) => section.id);
}

describe("buildItemDetail", () => {
  it("does not repeat the summary as a bullet", () => {
    const detail = buildItemDetail(
      item({
        metadata: {
          purpose: DRACO,
          // The pipeline stores the purpose again as the opening point.
          essentialPoints: [DRACO, "Écrit en Rust, sans navigateur headless."],
        },
      }),
      "fr",
    );

    const bullets = detail.sections.find((s) => s.id === "points");
    expect(bullets?.kind).toBe("bullets");
    if (bullets?.kind !== "bullets") throw new Error("expected bullets");

    expect(bullets.items).toEqual(["Écrit en Rust, sans navigateur headless."]);
    expect(bullets.items).not.toContain(DRACO);
  });

  it("drops the bullet section entirely when it only echoes the summary", () => {
    const detail = buildItemDetail(
      item({ metadata: { purpose: DRACO, essentialPoints: [DRACO] } }),
      "fr",
    );
    expect(sectionIds(detail)).not.toContain("points");
  });

  it("hides the long body when it is just the summary and points concatenated", () => {
    // This is exactly how `longAbout` is built for LLM-analysed items.
    const point = "Écrit en Rust, sans navigateur headless.";
    const detail = buildItemDetail(
      item({
        metadata: {
          purpose: DRACO,
          essentialPoints: [DRACO, point],
          about: `${DRACO}\n\n${point}`,
        },
      }),
      "fr",
    );
    expect(sectionIds(detail)).not.toContain("detail");
  });

  it("keeps the long body when it adds genuinely new paragraphs", () => {
    const extra =
      "Le projet expose un serveur MCP local afin que les agents interrogent les pages sans clé API externe ni quota mensuel.";
    const detail = buildItemDetail(
      item({
        metadata: {
          purpose: DRACO,
          essentialPoints: [DRACO],
          about: `${DRACO}\n\n${extra}`,
        },
      }),
      "fr",
    );

    const body = detail.sections.find((s) => s.id === "detail");
    expect(body?.kind).toBe("prose");
    if (body?.kind !== "prose") throw new Error("expected prose");
    expect(body.text).toContain("serveur MCP local");
    expect(body.text).not.toContain("drop-in replacement");
  });

  it("marks long prose as collapsible so nothing is silently cut", () => {
    const long = `${"Une phrase de contexte assez longue. ".repeat(20)}`;
    const detail = buildItemDetail(
      item({ metadata: { purpose: DRACO, about: long } }),
      "fr",
    );

    const body = detail.sections.find((s) => s.id === "detail");
    if (body?.kind !== "prose") throw new Error("expected prose");
    expect(body.collapsible).toBe(true);
    expect(body.text.endsWith("…")).toBe(false);
  });

  it("never ends the summary with an ellipsis", () => {
    const detail = buildItemDetail(item({ metadata: { purpose: DRACO } }), "fr");
    expect(detail.summary).toBe(DRACO);
    expect(detail.summary).not.toContain("…");
  });

  it("drops an impact line that restates the summary", () => {
    const detail = buildItemDetail(
      item({ metadata: { purpose: DRACO, impact: DRACO } }),
      "fr",
    );
    expect(sectionIds(detail)).not.toContain("impact");
  });

  it("always exposes the facts grid", () => {
    const detail = buildItemDetail(item({ metadata: { purpose: DRACO } }), "fr");
    expect(sectionIds(detail)).toContain("facts");
  });
});
