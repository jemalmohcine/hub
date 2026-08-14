import { describe, expect, it } from "vitest";
import {
  cityMatches,
  classifyWorkMode,
  isCredibleRegion,
  matchesSearchPrefs,
} from "@/modules/job-board/match";

describe("classifyWorkMode", () => {
  it("detects télétravail", () => {
    expect(
      classifyWorkMode({
        title: "Dev React",
        description: "Full remote, télétravail 100%",
        location: "France",
      }),
    ).toBe("remote");
  });

  it("detects hybride", () => {
    expect(
      classifyWorkMode({
        title: "Dev",
        description: "3j au bureau, hybride",
        location: "Paris",
      }),
    ).toBe("hybrid");
  });
});

describe("isCredibleRegion", () => {
  it("keeps France and drops generic worldwide", () => {
    expect(isCredibleRegion("Paris, France")).toBe(true);
    expect(isCredibleRegion("Worldwide", "United States only")).toBe(false);
    expect(isCredibleRegion("Remote", "Anywhere in the world")).toBe(false);
  });
});

describe("cityMatches", () => {
  it("matches Paris aliases", () => {
    expect(cityMatches("Paris", "Île-de-France")).toBe(true);
    expect(cityMatches("Lyon", "Marseille")).toBe(false);
  });
});

describe("matchesSearchPrefs", () => {
  it("keeps a Paris hybrid React offer", () => {
    expect(
      matchesSearchPrefs(
        {
          title: "Développeur React",
          description: "Poste hybride à Paris",
          location: "Paris",
          tags: ["react"],
          workMode: "hybrid",
        },
        { roleQuery: "react", city: "Paris", workMode: "hybrid" },
      ),
    ).toBe(true);
  });

  it("drops a US remote offer", () => {
    expect(
      matchesSearchPrefs(
        {
          title: "React engineer",
          description: "United States only",
          location: "Worldwide",
          tags: [],
          workMode: "remote",
        },
        { roleQuery: "react", city: "Paris", workMode: "remote" },
      ),
    ).toBe(false);
  });
});
