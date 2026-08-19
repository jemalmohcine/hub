import { describe, expect, it } from "vitest";
import {
  aiIntelInboxHref,
  parseAiFeedPeriod,
  parseAiFeedTab,
} from "@/modules/ai-intel/item-link";

describe("aiIntelInboxHref", () => {
  it("opens the AI feed on Urgent for the whole year", () => {
    expect(aiIntelInboxHref()).toBe("/app/ai?tab=urgent&period=year");
  });
});

describe("parseAiFeedTab", () => {
  it("keeps a known tab", () => {
    expect(parseAiFeedTab("urgent")).toBe("urgent");
  });

  it("falls back to all", () => {
    expect(parseAiFeedTab("nope")).toBe("all");
    expect(parseAiFeedTab(undefined)).toBe("all");
  });
});

describe("parseAiFeedPeriod", () => {
  it("keeps a known period", () => {
    expect(parseAiFeedPeriod("year")).toBe("year");
  });

  it("falls back to today", () => {
    expect(parseAiFeedPeriod("nope")).toBe("today");
    expect(parseAiFeedPeriod(undefined)).toBe("today");
  });
});
