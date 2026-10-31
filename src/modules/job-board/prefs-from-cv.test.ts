import { describe, expect, it } from "vitest";
import { prefsHintFromCv } from "@/modules/job-board/prefs-from-cv";
import type { CvDocument } from "@/modules/cv-builder/types";

describe("prefsHintFromCv", () => {
  it("reads role and Casablanca / Maroc from a saved CV", () => {
    const doc = {
      id: "cv-1",
      title: "CV · Tech Lead Full Stack en CDI au Maroc",
      targetJobTitle: "Tech Lead Full Stack",
      profile: {
        fullName: "Ada",
        headline: "Tech Lead Full Stack",
        email: "",
        phone: "",
        location: "Casablanca, Maroc",
        website: "",
        github: "",
        linkedin: "",
        summary: "",
      },
      experiences: [],
    } as unknown as CvDocument;

    const hint = prefsHintFromCv(doc);
    expect(hint.roles).toContain("tech-lead");
    expect(hint.locations).toEqual(expect.arrayContaining(["casablanca", "maroc"]));
  });

  it("ignores the unsaved default CV", () => {
    expect(prefsHintFromCv({ title: "Mon CV" } as CvDocument)).toEqual({
      roles: [],
      locations: [],
    });
  });
});
