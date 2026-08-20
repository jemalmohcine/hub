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

  it("does not guess présentiel when the card has no work-mode signal", () => {
    expect(
      classifyWorkMode({
        title: "Full Stack Developer",
        description: "",
        location: "Casablanca, Casablanca-Settat, Maroc",
      }),
    ).toBeNull();
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

  it("keeps generic software titles when the saved role is frontend", () => {
    expect(roleMatches("frontend", "Full Stack Developer")).toBe(true);
    expect(roleMatches("frontend", "Software Engineer - Casablanca CDI")).toBe(true);
    expect(roleMatches("frontend", "Développeur (H/F)")).toBe(true);
    expect(roleMatches("frontend", "Node.JS Developer")).toBe(true);
    expect(roleMatches("frontend", "Développeur Python")).toBe(false);
  });

  it("does not treat fully remote as full stack", () => {
    expect(roleMatches("fullstack", "Fully remote product manager")).toBe(false);
    expect(roleMatches("fullstack", "Fully remote Python developer")).toBe(true);
    expect(roleMatches("fullstack", "Développeur full stack")).toBe(true);
  });

  it("does not match react inside reactive or angular inside triangular", () => {
    expect(roleMatches("frontend", "reactive programming job")).toBe(false);
    expect(roleMatches("frontend", "triangular architecture")).toBe(false);
  });

  it("keeps generic développeur titles like Fullstack Engineer", () => {
    expect(roleMatches("développeur", "Fullstack Engineer (Kotlin / Vue)")).toBe(true);
    expect(roleMatches("développeur", "Software engineer — Casablanca")).toBe(true);
    expect(roleMatches("développeur", "Product manager")).toBe(false);
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

  it("keeps a LinkedIn Casablanca card for a frontend + hybrid search", () => {
    expect(
      matchesSearchPrefs(
        {
          title: "Full Stack Developer",
          description: "",
          location: "Casablanca, Casablanca-Settat, Maroc",
          tags: [],
          workMode: null,
        },
        jobPrefs({
          roleQuery: "frontend",
          roles: ["frontend"],
          locations: ["casablanca"],
          workModes: ["hybrid"],
          workMode: "hybrid",
        }),
      ),
    ).toBe(true);
  });

  it("keeps Rabat and Maroc-wide cards when Casablanca is the saved city", () => {
    const search = jobPrefs({
      roleQuery: "frontend",
      roles: ["frontend"],
      locations: ["casablanca"],
      workModes: ["hybrid"],
      workMode: "hybrid",
    });
    expect(
      matchesSearchPrefs(
        {
          title: "Software Engineer",
          description: "",
          location: "Rabat, Rabat-Salé-Kénitra, Maroc",
          tags: [],
          workMode: null,
        },
        search,
      ),
    ).toBe(true);
    expect(
      matchesSearchPrefs(
        {
          title: "Développeur (H/F)",
          description: "",
          location: "Maroc",
          tags: [],
          workMode: null,
        },
        search,
      ),
    ).toBe(true);
  });

  it("keeps an unlabeled Software Engineer in Casablanca", () => {
    expect(
      matchesSearchPrefs(
        {
          title: "Software Engineer - Casablanca CDI",
          description: "",
          location: "Casablanca, Maroc",
          tags: [],
          workMode: null,
        },
        jobPrefs({
          roleQuery: "frontend",
          roles: ["frontend"],
          locations: ["casablanca"],
          workModes: [],
          workMode: "hybrid",
        }),
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

