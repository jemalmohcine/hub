import { describe, expect, it } from "vitest";
import {
  itemInRange,
  rangeForPreset,
  type DateRangeValue,
} from "@/modules/ai-intel/ui/date-range-picker";

describe("rangeForPreset", () => {
  it("includes a year-to-date window for Cette année", () => {
    const range = rangeForPreset("year");
    const now = new Date();
    const yearStart = `${now.getFullYear()}-01-01`;
    expect(range.from).toBe(yearStart);
    expect(range.to.length).toBe(10);
    expect(range.from <= range.to).toBe(true);
  });
});

describe("itemInRange", () => {
  const today: DateRangeValue = {
    preset: "today",
    from: "2026-08-19",
    to: "2026-08-19",
  };

  it("keeps an item published on the selected day", () => {
    expect(itemInRange("2026-08-19", today)).toBe(true);
  });

  it("drops an item outside the selected day", () => {
    expect(itemInRange("2026-08-18", today)).toBe(false);
  });

  it("rejects a missing date", () => {
    expect(itemInRange("", today)).toBe(false);
  });
});
