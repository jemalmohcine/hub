import { describe, expect, it } from "vitest";
import { parseWwrTitle } from "@/modules/job-board/collectors/wwr";

describe("parseWwrTitle", () => {
  it("splits company and title", () => {
    expect(parseWwrTitle("Acme: Senior React Engineer")).toEqual({
      company: "Acme",
      title: "Senior React Engineer",
    });
  });
});
