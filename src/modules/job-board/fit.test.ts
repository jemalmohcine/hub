import { describe, expect, it } from "vitest";
import {
  fitLabel,
  listingWorthShowing,
  rankListingsForPrefs,
  scoreListingFit,
} from "@/modules/job-board/fit";
import type { JobListing, JobSearchPrefs } from "@/modules/job-board/types";
import { withJobSearchPrefs } from "@/modules/job-board/types";

const PREFS: JobSearchPrefs = withJobSearchPrefs({
  roles: ["frontend"],
  roleQuery: "Développeur frontend",
  locations: ["paris"],
  workModes: ["hybrid"],
  workMode: "hybrid",
});

function listing(
  over: Partial<JobListing> & Pick<JobListing, "title">,
): JobListing {
  return {
    id: over.id ?? over.title,
    canonicalKey: over.title,
    source: "indeed-fr",
    externalId: over.title,
    company: over.company ?? "Acme",
    title: over.title,
    description: over.description ?? "",
    url: "https://example.com",
    employmentCategory: over.employmentCategory ?? "salaried",
    freelanceSubtype: null,
    workMode: over.workMode !== undefined ? over.workMode : "hybrid",
    location: over.location ?? "Paris",
    salaryHint: null,
    tags: over.tags ?? [],
    publishedAt: over.publishedAt ?? "2026-08-01T00:00:00.000Z",
    scrapedAt: "2026-08-01T00:00:00.000Z",
  };
}

describe("scoreListingFit", () => {
  it("ranks a React title in Paris above a description-only mention", () => {
    const dedicated = scoreListingFit(
      listing({ title: "Développeur React", location: "Paris", workMode: "hybrid" }),
      PREFS,
      ["React", "TypeScript"],
    );
    const buried = scoreListingFit(
      listing({
        title: "Software engineer",
        description: "Stack interne, un peu de react",
        location: "France",
        workMode: "hybrid",
      }),
      PREFS,
    );
    expect(dedicated).toBeGreaterThan(buried);
    expect(fitLabel(dedicated)).toBe("excellent");
  });

  it("prefers the exact city over the country", () => {
    const city = scoreListingFit(
      listing({ title: "Frontend React", location: "Paris" }),
      PREFS,
    );
    const country = scoreListingFit(
      listing({ title: "Frontend React", location: "Lyon, France" }),
      PREFS,
    );
    expect(city).toBeGreaterThan(country);
  });

  it("demotes staff/principal unless the search is a lead role", () => {
    const staff = scoreListingFit(
      listing({ title: "Staff Frontend Engineer", location: "Paris" }),
      PREFS,
    );
    const mid = scoreListingFit(
      listing({ title: "Développeur frontend", location: "Paris" }),
      PREFS,
    );
    expect(staff).toBeLessThan(mid);
  });

  it("boosts CV skill overlap", () => {
    const withSkills = scoreListingFit(
      listing({
        title: "Développeur React",
        description: "TypeScript, Next.js, tests",
        location: "Paris",
      }),
      PREFS,
      ["TypeScript", "Next.js"],
    );
    const without = scoreListingFit(
      listing({ title: "Développeur React", location: "Paris" }),
      PREFS,
      [],
    );
    expect(withSkills).toBeGreaterThan(without);
  });

  it("ranks a CV skill hit above a role-only title when a CV is selected", () => {
    const cv = { skills: ["Kotlin", "Vue"], years: 3, roles: ["fullstack"] };
    const close = scoreListingFit(
      listing({
        title: "Fullstack Engineer (Kotlin / Vue)",
        location: "Paris",
      }),
      withJobSearchPrefs({ roles: ["fullstack"], locations: ["paris"] }),
      cv,
    );
    const far = scoreListingFit(
      listing({
        title: "Développeur full stack PHP",
        location: "Paris",
      }),
      withJobSearchPrefs({ roles: ["fullstack"], locations: ["paris"] }),
      cv,
    );
    expect(close).toBeGreaterThan(far);
  });

  it("demotes an 8-year ask when the CV only has two years", () => {
    const cv = { skills: ["React"], years: 2, roles: ["frontend"] };
    const mid = scoreListingFit(
      listing({ title: "Développeur React", location: "Paris" }),
      PREFS,
      cv,
    );
    const senior = scoreListingFit(
      listing({
        title: "Développeur React",
        description: "8+ years of experience",
        tags: ["exp-min-8"],
        location: "Paris",
      }),
      PREFS,
      cv,
    );
    expect(senior).toBeLessThan(mid);
  });
});

describe("rankListingsForPrefs", () => {
  it("puts the dedicated offer first and caps the list", () => {
    const ranked = rankListingsForPrefs(
      [
        listing({ title: "Python backend", location: "Nantes", id: "py" }),
        listing({ title: "Développeur React", location: "Paris", id: "react" }),
        listing({ title: "Staff Frontend Engineer", location: "Paris", id: "staff" }),
      ],
      PREFS,
      ["React"],
    );
    expect(ranked[0]?.id).toBe("react");
    expect(ranked[0]?.fitLabel).toBe("excellent");
  });
});

describe("listingWorthShowing", () => {
  it("keeps a city-only filter without a title", () => {
    expect(
      listingWorthShowing(
        listing({ title: "Développeur Python", location: "Paris" }),
        withJobSearchPrefs({ locations: ["paris"], workModes: ["hybrid"], workMode: "hybrid" }),
      ),
    ).toBe(true);
  });

  it("keeps a Casablanca LinkedIn card with unknown work mode", () => {
    const prefs = withJobSearchPrefs({
      roles: ["frontend"],
      locations: ["casablanca"],
      workModes: ["hybrid"],
      workMode: "hybrid",
    });
    expect(
      listingWorthShowing(
        listing({
          title: "Full Stack Developer",
          location: "Casablanca, Casablanca-Settat, Maroc",
          workMode: null,
        }),
        prefs,
      ),
    ).toBe(true);
    expect(
      listingWorthShowing(
        listing({
          title: "Software Engineer - Casablanca CDI",
          location: "Casablanca, Maroc",
          workMode: null,
        }),
        prefs,
        ["React", "TypeScript"],
      ),
    ).toBe(true);
    expect(
      listingWorthShowing(
        listing({
          title: "Développeur (H/F)",
          location: "Rabat, Maroc",
          workMode: null,
        }),
        prefs,
      ),
    ).toBe(true);
  });

  it("drops an 8-year ask when yearsMin is 2", () => {
    expect(
      listingWorthShowing(
        listing({
          title: "Développeur frontend",
          tags: ["exp-min-8"],
          location: "Paris",
        }),
        withJobSearchPrefs({ ...PREFS, yearsMin: 2 }),
      ),
    ).toBe(false);
  });

  it("keeps a junior title when yearsMin is 2", () => {
    expect(
      listingWorthShowing(
        listing({ title: "Développeur frontend junior", location: "Paris" }),
        withJobSearchPrefs({ ...PREFS, yearsMin: 2 }),
      ),
    ).toBe(true);
  });

  it("requires keyword tokens in the title", () => {
    const prefs = withJobSearchPrefs({ ...PREFS, keyword: "React Native" });
    expect(
      listingWorthShowing(listing({ title: "Développeur React Native", location: "Paris" }), prefs),
    ).toBe(true);
    expect(
      listingWorthShowing(listing({ title: "Développeur React", location: "Paris" }), prefs),
    ).toBe(false);
  });

  it("filters seniority and contract independently of the CV", () => {
    const prefs = withJobSearchPrefs({
      ...PREFS,
      seniority: "junior",
      employment: "salaried",
    });
    expect(
      listingWorthShowing(
        listing({ title: "Staff Frontend Engineer", location: "Paris" }),
        prefs,
      ),
    ).toBe(false);
    expect(
      listingWorthShowing(
        listing({
          title: "Développeur frontend junior",
          location: "Paris",
          employmentCategory: "freelance",
        }),
        prefs,
      ),
    ).toBe(false);
    expect(
      listingWorthShowing(
        listing({ title: "Développeur frontend junior", location: "Paris" }),
        prefs,
      ),
    ).toBe(true);
  });

  it("drops an offer published more than 30 days ago", () => {
    expect(
      listingWorthShowing(
        listing({
          title: "Développeur frontend",
          location: "Paris",
          publishedAt: "2026-07-01T00:00:00.000Z",
        }),
        PREFS,
      ),
    ).toBe(false);
  });

  it("drops offers older than postedWithinDays", () => {
    const prefs = withJobSearchPrefs({ ...PREFS, postedWithinDays: 7 });
    expect(
      listingWorthShowing(
        listing({
          title: "Développeur frontend",
          location: "Paris",
          publishedAt: "2026-07-01T00:00:00.000Z",
        }),
        prefs,
      ),
    ).toBe(false);
    expect(
      listingWorthShowing(
        listing({
          title: "Développeur frontend",
          location: "Paris",
          publishedAt: new Date().toISOString(),
        }),
        prefs,
      ),
    ).toBe(true);
  });
});
