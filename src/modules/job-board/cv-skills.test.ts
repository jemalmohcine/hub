import { describe, expect, it } from "vitest";
import { skillsFromCv } from "@/modules/job-board/cv-skills";
import type { CvDocument } from "@/modules/cv-builder/types";

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
    } as unknown as CvDocument);
    expect(skills).toEqual(["React", "TypeScript", "Next.js"]);
  });
});
