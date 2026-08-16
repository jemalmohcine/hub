import { describe, expect, it } from "vitest";
import {
  cityMatches,
  classifyWorkMode,
  isCredibleRegion,
  locationMatches,
  matchesSearchPrefs,
  roleMatches,
} from "@/modules/job-board/match";
import { resolveLocation } from "@/modules/job-board/locations";
import { withJobSearchPrefs } from "@/modules/job-board/types";

const jobPrefs = withJobSearchPrefs;

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

describe("locationMatches", () => {
  it("does not treat ISO ma as a substring of germany / management", () => {
    const maroc = resolveLocation("maroc");
    expect(locationMatches(maroc, "München", "German management team")).toBe(false);
    expect(locationMatches(maroc, "Casablanca, Maroc")).toBe(true);
    expect(locationMatches(maroc, "Rabat, MA")).toBe(true);
  });

  it("treats Paris as France, not München", () => {
    const france = resolveLocation("france");
    expect(locationMatches(france, "Paris (75)")).toBe(true);
    expect(locationMatches(france, "Lyon")).toBe(true);
    expect(locationMatches(france, "München")).toBe(false);
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

  it("maps the frontend catalog id to a React title", () => {
    expect(roleMatches("frontend", "Développeur React — Paris")).toBe(true);
    expect(roleMatches("frontend", "Data engineer Python")).toBe(false);
  });

  it("does not treat fully remote as full stack", () => {
    expect(roleMatches("fullstack", "Fully remote Python developer")).toBe(false);
    expect(roleMatches("fullstack", "Développeur full stack")).toBe(true);
  });

  it("does not match react inside reactive or angular inside triangular", () => {
    expect(roleMatches("frontend", "reactive programming job")).toBe(false);
    expect(roleMatches("frontend", "triangular architecture")).toBe(false);
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
        jobPrefs({ roleQuery: "react", roles: ["react"], locations: ["paris"], workModes: ["hybrid"], workMode: "hybrid" }),
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
        jobPrefs({ roleQuery: "react", roles: ["react"], locations: ["paris"], workModes: ["remote"], workMode: "remote" }),
      ),
    ).toBe(false);
  });

  it("keeps remote and onsite when both modes are selected", () => {
    const search = jobPrefs({
      roleQuery: "react",
      roles: ["react"],
      locations: ["casablanca"],
      workModes: ["remote", "onsite"],
      workMode: "remote",
    });
    expect(
      matchesSearchPrefs(
        {
          title: "React engineer",
          description: "Full remote, Maroc",
          location: "Casablanca, Maroc",
          tags: ["react"],
          workMode: "remote",
        },
        search,
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
        search,
      ),
    ).toBe(true);
  });

  it("drops an offer that only buries the stack in the description", () => {
    expect(
      matchesSearchPrefs(
        {
          title: "Software engineer",
          description: "On touche un peu à React dans un outil interne",
          location: "Paris",
          tags: [],
          workMode: "hybrid",
        },
        jobPrefs({ roleQuery: "react", roles: ["frontend"], locations: ["paris"], workModes: ["hybrid"], workMode: "hybrid" }),
      ),
    ).toBe(false);
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
        jobPrefs({
          roleQuery: "react",
          roles: ["react"],
          locations: ["belgique"],
          workModes: ["hybrid"],
          workMode: "hybrid",
        }),
      ),
    ).toBe(true);
  });

  it("drops a München Head of Engineering when searching frontend in Morocco", () => {
    expect(
      matchesSearchPrefs(
        {
          title: "Head of Engineering",
          description: "German management role, React in the stack, offices in Morocco sometimes",
          location: "München",
          tags: ["react", "javascript"],
          workMode: "onsite",
        },
        jobPrefs({
          roleQuery: "frontend",
          roles: ["frontend"],
          locations: ["maroc"],
          workModes: ["onsite"],
          workMode: "onsite",
        }),
      ),
    ).toBe(false);
  });

  it("drops a New York non-dev offer when searching Morocco", () => {
    expect(
      matchesSearchPrefs(
        {
          title: "Procurement Specialist",
          description: "Management role in the United States",
          location: "New York, New York, United States",
          tags: [],
          workMode: "onsite",
        },
        jobPrefs({
          roleQuery: "frontend",
          roles: ["frontend"],
          locations: ["maroc"],
          workModes: ["onsite"],
          workMode: "onsite",
        }),
      ),
    ).toBe(false);
  });

  it("keeps a Casablanca frontend offer for Morocco", () => {
    expect(
      matchesSearchPrefs(
        {
          title: "Développeur React",
          description: "",
          location: "Casablanca, Maroc",
          tags: [],
          workMode: "onsite",
        },
        jobPrefs({
          roleQuery: "frontend",
          roles: ["frontend"],
          locations: ["maroc"],
          workModes: ["onsite"],
          workMode: "onsite",
        }),
      ),
    ).toBe(true);
  });

  it("keeps a Europe remote React job when France is selected with télétravail", () => {
    const search = jobPrefs({
      roleQuery: "frontend",
      roles: ["frontend"],
      locations: ["france", "maroc"],
      workModes: ["remote", "hybrid", "onsite"],
      workMode: "remote",
    });
    expect(
      matchesSearchPrefs(
        {
          title: "Senior React Native Developer",
          description: "",
          location: "Europe",
          tags: [],
          workMode: "remote",
        },
        search,
      ),
    ).toBe(true);
    expect(
      matchesSearchPrefs(
        {
          title: "Web Frontend Engineer",
          description: "",
          location: "Anywhere",
          tags: [],
          workMode: "remote",
        },
        search,
      ),
    ).toBe(false);
    expect(
      matchesSearchPrefs(
        {
          title: "Frontend engineer",
          description: "",
          location: "EMEA, USA",
          tags: [],
          workMode: "remote",
        },
        search,
      ),
    ).toBe(true);
  });

  it("does not treat a Europe-only remote job as présentiel in France", () => {
    expect(
      matchesSearchPrefs(
        {
          title: "React engineer",
          description: "",
          location: "Europe",
          tags: [],
          workMode: "onsite",
        },
        jobPrefs({
          roleQuery: "frontend",
          roles: ["frontend"],
          locations: ["france"],
          workModes: ["onsite"],
          workMode: "onsite",
        }),
      ),
    ).toBe(false);
  });
});

