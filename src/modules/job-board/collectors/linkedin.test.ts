import { describe, expect, it } from "vitest";
import {
  canonicalLinkedInJobUrl,
  linkedinGuestSearchUrl,
  linkedinPlaceLabel,
  linkedinSearchPlaces,
  parseLinkedInGuestHtml,
} from "@/modules/job-board/collectors/linkedin";
import { resolveLocation } from "@/modules/job-board/locations";
import { withJobSearchPrefs } from "@/modules/job-board/types";

const GUEST_HTML = `
<ul>
  <li>
    <div class="base-card">
      <a class="base-card__full-link" href="https://www.linkedin.com/jobs/view/4299001001/?trk=public_jobs"></a>
      <h3 class="base-search-card__title">Développeur Frontend React</h3>
      <h4 class="base-search-card__subtitle">Capgemini</h4>
      <span class="job-search-card__location">Casablanca, Casablanca-Settat, Morocco</span>
      <time class="job-search-card__listdate" datetime="2026-08-12">Il y a 5 jours</time>
    </div>
  </li>
</ul>
`;

describe("canonicalLinkedInJobUrl", () => {
  it("keeps the numeric job id and drops tracking params", () => {
    expect(
      canonicalLinkedInJobUrl(
        "https://www.linkedin.com/jobs/view/4299001001/?trk=public_jobs_jserp-result",
      ),
    ).toBe("https://www.linkedin.com/jobs/view/4299001001");
  });

  it("reads the id at the end of a slug URL", () => {
    expect(
      canonicalLinkedInJobUrl(
        "https://ma.linkedin.com/jobs/view/fullstack-engineer-kotlin-vue-4413987826?trk=public_jobs",
      ),
    ).toBe("https://www.linkedin.com/jobs/view/4413987826");
  });
});

const SLUG_HTML = `
<div class="base-search-card">
  <a class="base-card__full-link" href="https://ma.linkedin.com/jobs/view/fullstack-engineer-kotlin-vue-4413987826?trk=public_jobs"></a>
  <h3 class="base-search-card__title">Fullstack Engineer (Kotlin / Vue)</h3>
  <h4 class="base-search-card__subtitle">Acme</h4>
  <span class="job-search-card__location">Casablanca, Morocco</span>
</div>
`;

describe("parseLinkedInGuestHtml", () => {
  it("reads the public job card", () => {
    expect(parseLinkedInGuestHtml(GUEST_HTML)).toEqual([
      {
        title: "Développeur Frontend React",
        company: "Capgemini",
        url: "https://www.linkedin.com/jobs/view/4299001001",
        location: "Casablanca, Casablanca-Settat, Morocco",
        publishedAt: "2026-08-12",
      },
    ]);
  });

  it("reads a slug URL on a card without wrapping li", () => {
    expect(parseLinkedInGuestHtml(SLUG_HTML)).toEqual([
      {
        title: "Fullstack Engineer (Kotlin / Vue)",
        company: "Acme",
        url: "https://www.linkedin.com/jobs/view/4413987826",
        location: "Casablanca, Morocco",
        publishedAt: null,
      },
    ]);
  });
});

describe("linkedinSearchPlaces", () => {
  it("searches Morocco plus hub cities, not Casablanca alone", () => {
    const places = linkedinSearchPlaces(
      withJobSearchPrefs({ locations: ["casablanca"] }),
    );
    expect(places.map((place) => place.id)).toEqual([
      "maroc",
      "casablanca",
      "rabat",
      "marrakech",
    ]);
  });

  it("expands a Morocco-only country search to the same hubs", () => {
    const places = linkedinSearchPlaces(withJobSearchPrefs({ locations: ["maroc"] }));
    expect(places.map((place) => place.id)).toEqual([
      "maroc",
      "casablanca",
      "rabat",
      "marrakech",
    ]);
  });
});

describe("linkedinGuestSearchUrl", () => {
  it("targets the guest endpoint for Casablanca", () => {
    const url = linkedinGuestSearchUrl(
      withJobSearchPrefs({
        roles: ["frontend"],
        locations: ["casablanca"],
        workModes: ["onsite"],
        workMode: "onsite",
      }),
      resolveLocation("casablanca"),
    );
    expect(url).toContain("jobs-guest/jobs/api/seeMoreJobPostings/search");
    expect(url).toContain("Casablanca");
    expect(url).toContain("Morocco");
    expect(decodeURIComponent(url)).toContain("développeur");
    expect(url).not.toContain("f_WT=");
  });

  it("adds the keyword to the LinkedIn query", () => {
    const url = linkedinGuestSearchUrl(
      withJobSearchPrefs({
        roles: ["frontend"],
        keyword: "React",
        locations: ["casablanca"],
      }),
      resolveLocation("casablanca"),
    );
    expect(url).toContain("React");
    expect(url).toContain("frontend");
    expect(url).toContain("keywords=");
  });

  it("does not pin LinkedIn to hybrid-only for a Casablanca search", () => {
    const url = linkedinGuestSearchUrl(
      withJobSearchPrefs({
        roles: ["frontend"],
        locations: ["casablanca"],
        workModes: ["hybrid"],
        workMode: "hybrid",
      }),
      resolveLocation("casablanca"),
    );
    expect(url).not.toContain("f_WT=");
  });
});

describe("linkedinPlaceLabel", () => {
  it("uses the English country name LinkedIn’s guest search expects", () => {
    expect(linkedinPlaceLabel(resolveLocation("casablanca"))).toBe("Casablanca, Morocco");
  });
});
