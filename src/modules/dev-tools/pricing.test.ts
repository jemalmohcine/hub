import { describe, expect, it } from "vitest";
import { detectFreeTier, detectStartingPrice } from "@/modules/dev-tools/pricing";

describe("detectFreeTier", () => {
  it("recognises a permanent free plan", () => {
    const result = detectFreeTier(
      "Free plan for personal projects. 100 GB bandwidth included.",
    );
    expect(result.hasFreeTier).toBe(true);
    expect(result.note).toContain("100 GB");
  });

  it("reads the run-together column headers of a pricing table", () => {
    expect(detectFreeTier("Sending & receivingFreeProScaleEnterpriseDaily limit100").hasFreeTier)
      .toBe(true);
  });

  it("does not turn a trial into a free tier", () => {
    expect(detectFreeTier("Start with a 14-day free trial, then $29/mo.").hasFreeTier).toBe(false);
  });

  it("says nothing when the page never mentions a free plan", () => {
    expect(detectFreeTier("Pro $29/mo. Business $99/mo. Enterprise: contact us.")).toEqual({
      hasFreeTier: false,
      note: null,
    });
  });
});

describe("detectStartingPrice", () => {
  it("keeps the cheapest paid plan", () => {
    expect(detectStartingPrice("Pro $29/mo · Team $99/mo · Scale $499/mo")).toBe(29);
  });

  it("reads euro amounts written after the number", () => {
    expect(detectStartingPrice("Starter 19,50 € par mois")).toBe(19.5);
  });

  it("ignores enterprise-sized figures that are never a starting price", () => {
    expect(detectStartingPrice("Entreprise à partir de 15000 € par an")).toBeNull();
  });

  it("prefers a monthly plan price over a per-unit rate", () => {
    expect(detectStartingPrice("Bandwidth $0.15 / GB · Pro $20 / month")).toBe(20);
  });

  it("ignores per-unit rates when no plan price is tagged monthly", () => {
    expect(detectStartingPrice("Storage billed at $0.02 per GB stored")).toBeNull();
  });

  it("returns null when there is no price at all", () => {
    expect(detectStartingPrice("Contact sales for pricing.")).toBeNull();
  });
});
