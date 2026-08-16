import { describe, expect, it } from "vitest";
import {
  wttjCountryFilter,
  wttjHitToRaw,
  wttjWorkMode,
} from "@/modules/job-board/collectors/wttj";

describe("wttjCountryFilter", () => {
  it("filters France when Paris is selected", () => {
    expect(
      wttjCountryFilter({
        roles: ["frontend"],
        roleQuery: "Développeur frontend",
        locations: ["paris"],
        workModes: ["hybrid"],
        workMode: "hybrid",
      }),
    ).toBe("offices.country_code:FR");
  });

  it("filters Morocco for Casablanca", () => {
    expect(
      wttjCountryFilter({
        roles: ["frontend"],
        roleQuery: "Développeur frontend",
        locations: ["casablanca"],
        workModes: ["onsite"],
        workMode: "onsite",
      }),
    ).toBe("offices.country_code:MA");
  });

  it("keeps both countries when France and Maroc are selected", () => {
    const filter = wttjCountryFilter({
      roles: ["frontend"],
      roleQuery: "Développeur frontend",
      locations: ["paris", "casablanca"],
      workModes: ["hybrid"],
      workMode: "hybrid",
    });
    expect(filter).toContain("offices.country_code:FR");
    expect(filter).toContain("offices.country_code:MA");
  });
});

describe("wttjHitToRaw", () => {
  it("builds a WTTJ apply URL from the public search hit", () => {
    const hit = wttjHitToRaw({
      objectID: "abc",
      name: "Frontend Engineer (JavaScript / React)",
      slug: "frontend-engineer-javascript-react_paris",
      summary: "React, TypeScript, Paris.",
      published_at: "2026-08-14T08:34:55Z",
      remote: "partial",
      salary_yearly_minimum: 47000,
      salary_maximum: 58000,
      salary_currency: "EUR",
      offices: [{ city: "Paris", country: "France", country_code: "FR" }],
      organization: { name: "Welcome to the Jungle", slug: "wttj" },
    });
    expect(hit).toMatchObject({
      source: "wttj",
      company: "Welcome to the Jungle",
      title: "Frontend Engineer (JavaScript / React)",
      location: "Paris, France",
      workMode: "hybrid",
    });
    expect(hit?.url).toBe(
      "https://www.welcometothejungle.com/fr/companies/wttj/jobs/frontend-engineer-javascript-react_paris",
    );
    expect(hit?.salaryHint).toContain("47");
    expect(hit?.salaryHint).toContain("€");
  });
});

describe("wttjWorkMode", () => {
  it("maps WTTJ remote policy", () => {
    expect(wttjWorkMode("fulltime")).toBe("remote");
    expect(wttjWorkMode("partial")).toBe("hybrid");
    expect(wttjWorkMode("no")).toBe("onsite");
  });
});
