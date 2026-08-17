import { describe, expect, it } from "vitest";
import {
  parseRekruteDate,
  parseRekruteSearchHtml,
  parseRekruteTitle,
  rekruteSearchUrl,
  wantsRekrute,
} from "@/modules/job-board/collectors/rekrute";
import { withJobSearchPrefs } from "@/modules/job-board/types";

const CARD = `
<ul class="job-list job-list2" id="post-data">
  <li class="post-id" id="185489">
    <img class="photo" alt="DXC - CDG" title="DXC - CDG" />
    <a class="titreJob" href="/offre-emploi-developpeur-fullstack-casablanca-185489.html">
      Développeur fullstack .NET/REACT Senior | Casablanca /Casanearshore (Maroc)
    </a>
    <div class="info"><span>React et .NET, 6 ans d’expérience.</span></div>
    <em class="date">Publication : du <span>12/08/2026</span> au <span>12/10/2026</span></em>
  </li>
  <li class="post-id" id="185303">
    <img class="photo" alt="Alten Maroc" />
    <a class="titreJob" href="/offre-emploi-developpeur-back-end-rabat-185303.html">
      Développeur back-end Spring | Rabat (Maroc)
    </a>
    <div class="info"><span>Spring Boot.</span></div>
    <em class="date"><span>01/08/2026</span></em>
  </li>
</ul>
`;

describe("parseRekruteTitle", () => {
  it("splits the city after the pipe", () => {
    expect(
      parseRekruteTitle("Développeur fullstack | Casablanca /Casanearshore (Maroc)"),
    ).toEqual({
      title: "Développeur fullstack",
      location: "Casablanca /Casanearshore (Maroc)",
    });
  });
});

describe("parseRekruteDate", () => {
  it("reads day/month/year as UTC midnight", () => {
    expect(parseRekruteDate("12/08/2026")).toBe("2026-08-12T00:00:00.000Z");
  });
});

describe("parseRekruteSearchHtml", () => {
  it("reads title, company, city and apply URL from a card", () => {
    const hits = parseRekruteSearchHtml(CARD);
    expect(hits).toHaveLength(2);
    expect(hits[0]).toMatchObject({
      title: "Développeur fullstack .NET/REACT Senior",
      company: "DXC - CDG",
      location: "Casablanca /Casanearshore (Maroc)",
      url: "https://www.rekrute.com/offre-emploi-developpeur-fullstack-casablanca-185489.html",
      publishedAt: "2026-08-12T00:00:00.000Z",
    });
    expect(hits[1]?.location).toContain("Rabat");
  });
});

describe("wantsRekrute", () => {
  it("only runs for Morocco searches", () => {
    expect(wantsRekrute(withJobSearchPrefs({ locations: ["casablanca"] }))).toBe(true);
    expect(wantsRekrute(withJobSearchPrefs({ locations: ["paris"] }))).toBe(false);
  });
});

describe("rekruteSearchUrl", () => {
  it("hits the public search with the role", () => {
    expect(rekruteSearchUrl("Développeur frontend")).toContain("rekrute.com/offres.html");
    expect(rekruteSearchUrl("Développeur frontend")).toContain("keyword=");
  });
});
