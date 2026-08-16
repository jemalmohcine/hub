import { describe, expect, it } from "vitest";
import { parseIndeedRssTitle } from "@/modules/job-board/collectors/indeed-fr";

describe("parseIndeedRssTitle", () => {
  it("reads the job city from the RSS title, not the search city", () => {
    expect(
      parseIndeedRssTitle("Développeur React - Acme - Lyon (69)"),
    ).toEqual({
      title: "Développeur React",
      company: "Acme",
      location: "Lyon (69)",
    });
  });

  it("keeps a two-part title without inventing a place", () => {
    expect(parseIndeedRssTitle("Frontend engineer - Acme")).toEqual({
      title: "Frontend engineer",
      company: "Acme",
      location: "",
    });
  });
});
