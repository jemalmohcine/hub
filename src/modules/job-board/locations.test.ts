import { describe, expect, it } from "vitest";
import { suggestLocations, resolveLocation, isMoroccoPlace, expandMoroccoCountry, resolveLocations } from "@/modules/job-board/locations";

describe("suggestLocations", () => {
  it("returns closest cities and countries for a prefix", () => {
    const hits = suggestLocations("par", []);
    expect(hits.some((entry) => entry.id === "paris")).toBe(true);
  });

  it("finds a country from an alias", () => {
    const hits = suggestLocations("belgium", []);
    expect(hits[0]?.id).toBe("belgique");
  });

  it("skips already selected ids", () => {
    const hits = suggestLocations("par", ["paris"]);
    expect(hits.some((entry) => entry.id === "paris")).toBe(false);
  });
});

describe("resolveLocation", () => {
  it("finds Casablanca and Maroc", () => {
    expect(resolveLocation("casa").id).toBe("casablanca");
    expect(resolveLocation("Morocco").id).toBe("maroc");
    expect(isMoroccoPlace(resolveLocation("casablanca"))).toBe(true);
    expect(isMoroccoPlace(resolveLocation("paris"))).toBe(false);
    expect(suggestLocations("casa", []).some((entry) => entry.id === "casablanca")).toBe(true);
  });
});

describe("expandMoroccoCountry", () => {
  it("adds Maroc when Casablanca is selected", () => {
    const expanded = expandMoroccoCountry(resolveLocations(["casablanca"]));
    expect(expanded.map((entry) => entry.id)).toEqual(["casablanca", "maroc"]);
  });

  it("does not expand Paris to France unless asked", () => {
    expect(expandMoroccoCountry(resolveLocations(["paris"])).map((entry) => entry.id)).toEqual([
      "paris",
    ]);
  });
});
