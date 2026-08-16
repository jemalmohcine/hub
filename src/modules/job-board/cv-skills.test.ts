import { describe, expect, it } from "vitest";
import { profileFromCv, skillsFromCv, yearsFromExperiences } from "@/modules/job-board/cv-skills";
import type { CvDocument, CvExperience } from "@/modules/cv-builder/types";

describe("skillsFromCv", () => {
  it("ignores the unsaved default CV", () => {
    expect(
      skillsFromCv({
        title: "Mon CV",
        skillGroups: [{ id: "g", label: "Langages", skills: [{ id: "s", name: "React" }] }],
        experiences: [],
      } as unknown as CvDocument),
    ).toEqual([]);
  });

  it("takes distinctive skills and tech stack", () => {
    const skills = skillsFromCv({
      id: "cv-1",
      skillGroups: [
        {
          id: "g",
          label: "Frontend",
          skills: [
            { id: "s1", name: "React" },
            { id: "s2", name: "TypeScript" },
          ],
        },
      ],
      experiences: [{ techStack: ["Next.js", "React"] }],
      projects: [{ techStack: ["Vitest"] }],
    } as unknown as CvDocument);
    expect(skills).toEqual(["React", "TypeScript", "Next.js", "Vitest"]);
  });
});

describe("yearsFromExperiences", () => {
  it("sums dated roles", () => {
    const experiences = [
      {
        startDate: "2022-01-01",
        endDate: "2024-01-01",
        current: false,
      },
      {
        startDate: "2024-01-01",
        endDate: "",
        current: true,
      },
    ] as CvExperience[];
    expect(yearsFromExperiences(experiences, new Date("2026-01-01"))).toBe(4);
  });
});

describe("profileFromCv", () => {
  it("bundles stack, years and role hint", () => {
    const profile = profileFromCv({
      id: "cv-1",
      title: "CV frontend",
      targetJobTitle: "Développeur frontend",
      profile: {
        location: "Paris",
        headline: "Développeur frontend",
      },
      skillGroups: [{ skills: [{ name: "React" }] }],
      experiences: [
        {
          role: "Frontend",
          startDate: "2023-01-01",
          current: true,
          techStack: ["TypeScript"],
        },
      ],
    } as unknown as CvDocument);
    expect(profile?.roles).toContain("frontend");
    expect(profile?.locations).toContain("paris");
    expect(profile?.skills).toEqual(expect.arrayContaining(["React", "TypeScript"]));
    expect(profile?.years).toBeGreaterThan(0);
  });
});
