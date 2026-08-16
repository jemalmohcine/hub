import { describe, expect, it } from "vitest";
import { cvReadiness } from "@/modules/cv-builder/readiness";
import { defaultCvDocument } from "@/modules/cv-builder/defaults";

describe("cvReadiness", () => {
  it("asks for identity on the default template", () => {
    const result = cvReadiness(defaultCvDocument());
    expect(result.ready).toBe(false);
    expect(result.hints.map((hint) => hint.id)).toEqual(
      expect.arrayContaining(["name", "email"]),
    );
  });

  it("is ready when profile, a job and a stack are filled", () => {
    const doc = defaultCvDocument();
    doc.profile.fullName = "Mohcine Jemal";
    doc.profile.email = "mohcine@example.com";
    doc.profile.location = "Paris";
    doc.profile.headline = "Développeur frontend";
    doc.profile.summary = "Je construis des interfaces React depuis plusieurs années en produit.";
    doc.targetJobTitle = "Développeur frontend";
    doc.experiences = [
      {
        id: "e1",
        company: "Acme",
        role: "Frontend",
        startDate: "2022-01",
        endDate: "",
        current: true,
        highlights: ["Livré un design system utilisé par 4 squads"],
        techStack: ["React"],
      },
    ];
    doc.skillGroups = [
      {
        id: "g1",
        label: "Frontend",
        skills: [
          { id: "s1", name: "React" },
          { id: "s2", name: "TypeScript" },
          { id: "s3", name: "Next.js" },
        ],
      },
    ];
    const result = cvReadiness(doc);
    expect(result.ready).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.hints).toEqual([]);
  });
});
