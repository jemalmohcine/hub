import { describe, expect, it } from "vitest";
import { boardSearchQueries, linkedinSearchKeywords, prefsForScrape } from "@/modules/job-board/scrape-query";
import type { CvJobProfile } from "@/modules/job-board/cv-skills";
import { withJobSearchPrefs } from "@/modules/job-board/types";

const cv: CvJobProfile = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "CV React",
  skills: ["React", "TypeScript", "Node"],
  years: 4,
  roles: ["frontend"],
  locations: ["casablanca"],
};

describe("prefsForScrape", () => {
  it("keeps explicit prefs over the CV", () => {
    const prefs = withJobSearchPrefs({
      roles: ["backend"],
      locations: ["paris"],
      keyword: "Go",
      yearsMin: 5,
      cvDocumentId: cv.id,
    });
    expect(prefsForScrape(prefs, cv)).toMatchObject({
      roles: ["backend"],
      locations: ["paris"],
      keyword: "Go",
      yearsMin: 5,
    });
  });

  it("fills empty role and city from the CV, not the skill keywords", () => {
    const prefs = withJobSearchPrefs({ cvDocumentId: cv.id });
    const scrape = prefsForScrape(prefs, cv);
    expect(scrape.roles).toEqual(["frontend"]);
    expect(scrape.locations).toEqual(["casablanca"]);
    expect(scrape.keyword).toBe("");
    expect(scrape.yearsMin).toBe(3);
    expect(scrape.cvDocumentId).toBe(cv.id);
  });

  it("does nothing without a CV", () => {
    const prefs = withJobSearchPrefs({ roles: ["frontend"] });
    expect(prefsForScrape(prefs, null)).toEqual(prefs);
  });
});

describe("boardSearchQueries", () => {
  it("joins the role and the keyword for a precise query", () => {
    expect(
      boardSearchQueries(
        withJobSearchPrefs({
          roles: ["frontend"],
          keyword: "React",
        }),
      ),
    ).toEqual(["Développeur frontend React"]);
  });

  it("returns nothing when the search is empty", () => {
    expect(boardSearchQueries(withJobSearchPrefs())).toEqual([]);
  });
});

describe("linkedinSearchKeywords", () => {
  it("searches développeur in the city instead of the frontend chip", () => {
    expect(
      linkedinSearchKeywords(withJobSearchPrefs({ roles: ["frontend"], locations: ["casablanca"] })),
    ).toBe("développeur");
  });
});
