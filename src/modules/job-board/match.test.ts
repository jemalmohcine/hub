import { describe, expect, it } from "vitest";
import {
  cityMatches,
  classifyWorkMode,
  isCredibleRegion,
  matchesSearchPrefs,
  roleMatches,
} from "@/modules/job-board/match";
import type { JobSearchPrefs } from "@/modules/job-board/types";

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

describe("roleMatches", () => {
  it("uses the tech token, not just développeur", () => {
    expect(roleMatches("développeur React", "React engineer, Paris")).toBe(true);
    expect(roleMatches("développeur React", "Python backend, Lyon")).toBe(false);
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
        { roleQuery: "react", roles: ["react"], locations: ["paris"], workModes: ["hybrid"], workMode: "hybrid" },
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
        { roleQuery: "react", roles: ["react"], locations: ["paris"], workModes: ["remote"], workMode: "remote" },
      ),
    ).toBe(false);
  });

  it("keeps remote and onsite when both modes are selected", () => {
    const prefs: JobSearchPrefs = {
      roleQuery: "react",
      roles: ["react"],
      locations: ["casablanca"],
      workModes: ["remote", "onsite"],
      workMode: "remote",
    };
    expect(
      matchesSearchPrefs(
        {
          title: "React engineer",
          description: "Full remote, Maroc",
          location: "Casablanca, Maroc",
          tags: ["react"],
          workMode: "remote",
        },
        prefs,
      ),
    ).toBe(true);
    expect(
      matchesSearchPrefs(
        {
          title: "React engineer",
          description: "Présentiel à Casablanca",
          location: "Casablanca, Maroc",
          tags: ["react"],
          workMode: "onsite",
        },
        prefs,
      ),
    ).toBe(true);
  });

  it("keeps Belgium when selected", () => {
    expect(
      matchesSearchPrefs(
        {
          title: "React developer",
          description: "Hybrid in Brussels",
          location: "Bruxelles, Belgique",
          tags: ["react"],
          workMode: "hybrid",
        },
        {
          roleQuery: "react",
          roles: ["react"],
          locations: ["belgique"],
          workModes: ["hybrid"],
          workMode: "hybrid",
        },
      ),
    ).toBe(true);
  });
});
