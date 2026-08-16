import { describe, expect, it } from "vitest";
import {
  applyBoardsForPrefs,
  franceTravailSearchUrl,
  helloWorkSearchUrl,
  indeedJobsSearchUrl,
  rekruteSearchUrl,
  wttjJobsSearchUrl,
} from "@/modules/job-board/apply-boards";
import type { JobSearchPrefs } from "@/modules/job-board/types";
import { withJobSearchPrefs } from "@/modules/job-board/types";

function prefs(partial: Partial<JobSearchPrefs>): JobSearchPrefs {
  return withJobSearchPrefs({
    roles: ["frontend"],
    roleQuery: "Développeur frontend",
    locations: ["paris"],
    workModes: ["hybrid"],
    workMode: "hybrid",
    ...partial,
  });
}

describe("applyBoardsForPrefs", () => {
  it("opens LinkedIn and Indeed first for a French search", () => {
    const boards = applyBoardsForPrefs(prefs({}));
    expect(boards.map((board) => board.id)).toEqual([
      "linkedin",
      "indeed",
      "wttj",
      "france-travail",
      "hellowork",
    ]);
    expect(boards[0]?.url).toContain("linkedin.com/jobs/search");
    expect(boards[1]?.url).toContain("fr.indeed.com/jobs");
    expect(boards[1]?.url).toContain("Paris");
  });

  it("switches Indeed to Morocco and adds Rekrute, without France Travail", () => {
    const boards = applyBoardsForPrefs(prefs({ locations: ["casablanca"] }));
    expect(boards.map((board) => board.id)).toEqual(["linkedin", "indeed", "rekrute"]);
    expect(boards.find((board) => board.id === "indeed")?.url).toContain("ma.indeed.com/jobs");
    expect(boards.find((board) => board.id === "rekrute")?.url).toContain("rekrute.com/offres.html");
  });

  it("keeps both country boards when France and Maroc are selected", () => {
    const ids = applyBoardsForPrefs(prefs({ locations: ["paris", "casablanca"] })).map(
      (board) => board.id,
    );
    expect(ids).toContain("wttj");
    expect(ids).toContain("france-travail");
    expect(ids).toContain("rekrute");
  });

  it("returns nothing until a role is chosen", () => {
    expect(applyBoardsForPrefs(prefs({ roles: [], roleQuery: "" }))).toEqual([]);
  });
});

describe("board search urls", () => {
  it("adds Indeed remote filter only when remote is the sole mode", () => {
    const remote = indeedJobsSearchUrl(prefs({ workModes: ["remote"], workMode: "remote" }));
    expect(remote).toContain("sc=");
    const hybrid = indeedJobsSearchUrl(prefs({ workModes: ["hybrid"], workMode: "hybrid" }));
    expect(hybrid).not.toContain("sc=");
  });

  it("fills WTTJ, France Travail, HelloWork and Rekrute with the role", () => {
    const search = prefs({});
    expect(wttjJobsSearchUrl(search)).toContain("welcometothejungle.com/fr/jobs");
    expect(wttjJobsSearchUrl(search)).toContain("aroundQuery=");
    expect(franceTravailSearchUrl(search)).toContain("francetravail.io/offres/recherche");
    expect(franceTravailSearchUrl(search)).toContain("motsCles=");
    expect(helloWorkSearchUrl(search)).toContain("hellowork.com");
    expect(helloWorkSearchUrl(search)).toContain("k=");
    expect(rekruteSearchUrl(prefs({ locations: ["casablanca"] }))).toContain("keyword=");
  });
});
