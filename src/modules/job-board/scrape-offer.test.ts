import { describe, expect, it } from "vitest";
import * as cheerio from "cheerio";
import { readJobPostingJsonLd } from "@/modules/job-board/scrape-offer";

describe("readJobPostingJsonLd", () => {
  it("reads title, company and city from JobPosting", () => {
    const html = `<script type="application/ld+json">${JSON.stringify({
      "@type": "JobPosting",
      title: "Développeur React",
      hiringOrganization: { name: "Acme" },
      jobLocation: {
        "@type": "Place",
        address: {
          addressLocality: "Lyon",
          addressCountry: "FR",
        },
      },
      description: "Poste hybride.",
    })}</script>`;
    const offer = readJobPostingJsonLd(cheerio.load(html));
    expect(offer?.title).toBe("Développeur React");
    expect(offer?.company).toBe("Acme");
    expect(offer?.location).toContain("Lyon");
  });
});
