import { describe, expect, it } from "vitest";
import { resolveRole } from "@/modules/job-board/roles";

describe("resolveRole", () => {
  it("does not map a generic développeur query onto frontend", () => {
    expect(resolveRole("développeur").id).not.toBe("frontend");
    expect(resolveRole("developer").id).toBe("developer");
  });

  it("still maps a specific frontend label", () => {
    expect(resolveRole("Développeur frontend").id).toBe("frontend");
    expect(resolveRole("frontend").id).toBe("frontend");
  });
});
