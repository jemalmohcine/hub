import { describe, expect, it } from "vitest";
import { formatCompactNumber, formatCurrencyCents, formatNumber } from "@/lib/numbers";

describe("formatCompactNumber", () => {
  it("keeps small numbers exact", () => {
    expect(formatCompactNumber(0)).toBe("0");
    expect(formatCompactNumber(999)).toBe("999");
  });

  it("switches to k above a thousand and drops decimals above ten thousand", () => {
    expect(formatCompactNumber(1_200)).toBe("1.2k");
    expect(formatCompactNumber(24_000)).toBe("24k");
  });

  it("switches to M above a million", () => {
    expect(formatCompactNumber(2_400_000)).toBe("2.4M");
  });

  it("never returns NaN", () => {
    expect(formatCompactNumber(Number.NaN)).toBe("0");
  });
});

describe("formatNumber", () => {
  it("groups thousands", () => {
    expect(formatNumber(1234, "en")).toBe("1,234");
  });
});

describe("formatCurrencyCents", () => {
  it("renders whole euros from cents", () => {
    expect(formatCurrencyCents(125_000, "en")).toContain("1,250");
  });
});
