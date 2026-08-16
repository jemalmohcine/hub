import { describe, expect, it } from "vitest";
import {
  EMPTY_JOB_SEARCH_FILTERS,
  hasActiveJobFilters,
  parseJobSearchFilters,
  yearsMinFromExperience,
} from "@/modules/job-board/filters";
import { EMPTY_JOB_SEARCH_PREFS } from "@/modules/job-board/types";

describe("parseJobSearchFilters", () => {
  it("returns defaults for garbage", () => {
    expect(parseJobSearchFilters(null)).toEqual(EMPTY_JOB_SEARCH_FILTERS);
    expect(parseJobSearchFilters("nope")).toEqual(EMPTY_JOB_SEARCH_FILTERS);
    expect(parseJobSearchFilters({ yearsMin: 4, seniority: "lead" })).toEqual({
      ...EMPTY_JOB_SEARCH_FILTERS,
    });
  });

  it("keeps a valid saved payload", () => {
    expect(
      parseJobSearchFilters({
        cvDocumentId: "11111111-1111-4111-8111-111111111111",
        yearsMin: 3,
        keyword: "  React Native  ",
        seniority: "junior",
        postedWithinDays: 7,
        employment: "salaried",
      }),
    ).toEqual({
      cvDocumentId: "11111111-1111-4111-8111-111111111111",
      yearsMin: 3,
      keyword: "React Native",
      seniority: "junior",
      postedWithinDays: 7,
      employment: "salaried",
    });
  });
});

describe("yearsMinFromExperience", () => {
  it("snaps down onto the discrete scale", () => {
    expect(yearsMinFromExperience(0.4)).toBe(0);
    expect(yearsMinFromExperience(2.9)).toBe(2);
    expect(yearsMinFromExperience(6)).toBe(5);
    expect(yearsMinFromExperience(12)).toBe(8);
  });
});

describe("hasActiveJobFilters", () => {
  it("is false on empty prefs", () => {
    expect(hasActiveJobFilters(EMPTY_JOB_SEARCH_PREFS)).toBe(false);
  });

  it("is true for city, years or a chosen CV", () => {
    expect(hasActiveJobFilters({ ...EMPTY_JOB_SEARCH_PREFS, locations: ["paris"] })).toBe(true);
    expect(hasActiveJobFilters({ ...EMPTY_JOB_SEARCH_PREFS, yearsMin: 2 })).toBe(true);
    expect(
      hasActiveJobFilters({
        ...EMPTY_JOB_SEARCH_PREFS,
        cvDocumentId: "11111111-1111-4111-8111-111111111111",
      }),
    ).toBe(true);
  });
});
