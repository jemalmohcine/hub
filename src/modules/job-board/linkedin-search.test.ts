import { describe, expect, it } from "vitest";
import { linkedinJobsSearchUrl } from "@/modules/job-board/linkedin-search";
import { withJobSearchPrefs } from "@/modules/job-board/types";

describe("linkedinJobsSearchUrl", () => {
  it("fills keywords and city without forcing a work mode", () => {
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
    expect(decodeURIComponent(url)).toContain("développeur");
    expect(url).not.toContain("f_WT=");
  });

  it("uses Casablanca, Morocco so the browser search matches the scrape", () => {
    const url = linkedinJobsSearchUrl(
      withJobSearchPrefs({
        roles: ["frontend"],
        locations: ["casablanca"],
        workModes: ["hybrid"],
        workMode: "hybrid",
      }),
    );
    expect(url).toContain("Casablanca%2C+Morocco");
  });
});
