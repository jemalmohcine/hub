import { describe, expect, it } from "vitest";
import {
  classifyCategoryLocal,
  matchExistingCategory,
  normalizeCategoryName,
} from "@/modules/dev-snippets/classify-category";

describe("normalizeCategoryName", () => {
  it("trims and caps length", () => {
    expect(normalizeCategoryName("  Docker  ")).toBe("Docker");
    expect(normalizeCategoryName("a".repeat(50)).length).toBe(40);
  });
});

describe("matchExistingCategory", () => {
  it("reuses the existing spelling", () => {
    expect(matchExistingCategory("docker", ["Docker", "React"])).toBe("Docker");
  });
});

describe("classifyCategoryLocal", () => {
  it("reuses an existing category mentioned in the title", () => {
    expect(
      classifyCategoryLocal(
        { title: "Docker healthcheck", content: "", language: "bash", tags: [] },
        ["Docker", "Frontend"],
      ),
    ).toBe("Docker");
  });

  it("names Docker from the content when nothing exists yet", () => {
    expect(
      classifyCategoryLocal(
        {
          title: "Healthcheck",
          content: "HEALTHCHECK CMD\nFROM postgres",
          language: "docker",
          tags: [],
        },
        [],
      ),
    ).toBe("Docker");
  });

  it("falls back to the language", () => {
    expect(
      classifyCategoryLocal(
        {
          title: "Fetch timeout",
          content: "AbortSignal.timeout(5_000)",
          language: "javascript",
          tags: [],
        },
        [],
      ),
    ).toBe("JavaScript");
  });

  it("uses Général when nothing specific stands out", () => {
    expect(
      classifyCategoryLocal(
        { title: "TODO", content: "penser à ça", language: "other", tags: [] },
        [],
      ),
    ).toBe("Général");
  });
});
