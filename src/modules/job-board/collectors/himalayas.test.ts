import { describe, expect, it } from "vitest";
import {
  himalayasIsEuropeFriendly,
  himalayasIsSoftware,
} from "@/modules/job-board/collectors/himalayas";

describe("himalayasIsSoftware", () => {
  it("keeps engineering titles and drops marketing", () => {
    expect(himalayasIsSoftware({ title: "Senior React Engineer" })).toBe(true);
    expect(
      himalayasIsSoftware({
        title: "Demand Generation Manager",
        parentCategories: ["Marketing"],
      }),
    ).toBe(false);
  });
});

describe("himalayasIsEuropeFriendly", () => {
  it("drops US-only and keeps Europe or open remote", () => {
    expect(himalayasIsEuropeFriendly({ locationRestrictions: ["United States"] })).toBe(false);
    expect(himalayasIsEuropeFriendly({ locationRestrictions: ["France", "Germany"] })).toBe(true);
    expect(himalayasIsEuropeFriendly({ locationRestrictions: [] })).toBe(true);
  });
});
