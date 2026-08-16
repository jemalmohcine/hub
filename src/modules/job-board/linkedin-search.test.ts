import { describe, expect, it } from "vitest";
import { linkedinJobsSearchUrl } from "@/modules/job-board/linkedin-search";
import { withJobSearchPrefs } from "@/modules/job-board/types";

describe("linkedinJobsSearchUrl", () => {
  it("fills keywords, city and work mode", () => {
    const url = linkedinJobsSearchUrl(
      withJobSearchPrefs({
        roles: ["frontend"],
        roleQuery: "Développeur frontend",
        locations: ["paris"],
        workModes: ["hybrid"],
        workMode: "hybrid",
      }),
    );
    expect(url).toContain("https://www.linkedin.com/jobs/search/?");
    expect(url).toContain("keywords=");
    expect(url).toContain("Paris");
    expect(url).toContain("f_WT=3");
  });
});
