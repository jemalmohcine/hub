import { describe, expect, it } from "vitest";
import { detectFreeTier, detectStartingPrice } from "@/modules/dev-tools/pricing";

describe("detectFreeTier", () => {
  it("recognises a permanent free plan", () => {
    const result = detectFreeTier(
      "Hobby — Free plan for personal projects. 100 GB bandwidth included.",
    );
    expect(result.hasFreeTier).toBe(true);
    expect(result.note).toContain("100 GB");
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

  it("returns null when there is no price at all", () => {
    expect(detectStartingPrice("Contact sales for pricing.")).toBeNull();
  });
});
