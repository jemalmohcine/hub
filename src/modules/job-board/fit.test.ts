import { describe, expect, it } from "vitest";
import {
  fitLabel,
  rankListingsForPrefs,
  scoreListingFit,
} from "@/modules/job-board/fit";
import type { JobListing, JobSearchPrefs } from "@/modules/job-board/types";

const PREFS: JobSearchPrefs = {
  roles: ["frontend"],
  roleQuery: "Développeur frontend",
  locations: ["paris"],
  workModes: ["hybrid"],
  workMode: "hybrid",
};

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
    employmentCategory: "salaried",
    freelanceSubtype: null,
    workMode: over.workMode ?? "hybrid",
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
