import { linkedinJobsSearchUrl } from "@/modules/job-board/linkedin-search";
import { resolveLocations } from "@/modules/job-board/locations";
import { resolveRoles, rolesToQuery } from "@/modules/job-board/roles";
import type { JobSearchPrefs } from "@/modules/job-board/types";
import { normalizeWorkModes } from "@/modules/job-board/work-modes";

const INDEED_HOST: Record<string, string> = {
  france: "fr.indeed.com",
  maroc: "ma.indeed.com",
  belgique: "be.indeed.com",
  suisse: "ch.indeed.com",
  canada: "ca.indeed.com",
  allemagne: "de.indeed.com",
  "pays-bas": "nl.indeed.com",
  espagne: "es.indeed.com",
  portugal: "pt.indeed.com",
  italie: "it.indeed.com",
  "royaume-uni": "uk.indeed.com",
  emirats: "ae.indeed.com",
};

export type ApplyBoardId =
  | "linkedin"
  | "indeed"
  | "wttj"
  | "france-travail"
  | "hellowork"
  | "rekrute";

export type ApplyBoard = {
  id: ApplyBoardId;
  label: string;
  url: string;
  featured: boolean;
};

function searchKeywords(prefs: JobSearchPrefs): string {
  const roles = resolveRoles(
    prefs.roles.length > 0 ? prefs.roles : prefs.roleQuery ? [prefs.roleQuery] : [],
  );
  return rolesToQuery(roles.map((role) => role.id)) || prefs.roleQuery.trim();
}

function firstPlace(prefs: JobSearchPrefs) {
  return resolveLocations(prefs.locations)[0];
}

function countryIds(prefs: JobSearchPrefs): Set<string> {
  const ids = new Set<string>();
  for (const place of resolveLocations(prefs.locations)) {
    ids.add(place.kind === "city" ? place.countryId : place.id);
  }
  return ids;
}

function indeedHostFor(locationId: string, countryId: string): string {
  return INDEED_HOST[locationId] ?? INDEED_HOST[countryId] ?? "fr.indeed.com";
}

export function indeedJobsSearchUrl(prefs: JobSearchPrefs): string {
  const place = firstPlace(prefs);
  const host = indeedHostFor(place?.id ?? "france", place?.countryId ?? "france");
  const params = new URLSearchParams();
  const keywords = searchKeywords(prefs);
  if (keywords) params.set("q", keywords);
  if (place) params.set("l", place.indeed || place.label);
  const modes = normalizeWorkModes(prefs);
  if (modes.length === 1 && modes[0] === "remote") {
    params.set("sc", "0kf:attr(DSQF7);");
  }
  return `https://${host}/jobs?${params.toString()}`;
}

export function wttjJobsSearchUrl(prefs: JobSearchPrefs): string {
  const params = new URLSearchParams();
  const keywords = searchKeywords(prefs);
  if (keywords) params.set("query", keywords);
  const place = firstPlace(prefs);
  if (place && (place.id === "france" || place.countryId === "france" || place.id === "belgique" || place.countryId === "belgique")) {
    params.set("aroundQuery", place.kind === "city" ? `${place.label}, ${place.countryId === "belgique" ? "Belgium" : "France"}` : place.label);
  }
  return `https://www.welcometothejungle.com/fr/jobs?${params.toString()}`;
}

export function franceTravailSearchUrl(prefs: JobSearchPrefs): string {
  const params = new URLSearchParams();
  const keywords = searchKeywords(prefs);
  if (keywords) params.set("motsCles", keywords);
  params.set("offresPartenaires", "true");
  params.set("rayon", "0");
  params.set("tri", "0");
  return `https://candidat.francetravail.io/offres/recherche?${params.toString()}`;
}

export function helloWorkSearchUrl(prefs: JobSearchPrefs): string {
  const params = new URLSearchParams();
  const keywords = searchKeywords(prefs);
  if (keywords) params.set("k", keywords);
  const place = firstPlace(prefs);
  if (place && (place.id === "france" || place.countryId === "france")) {
    params.set("l", place.label);
  }
  return `https://www.hellowork.com/fr-fr/emploi/recherche.html?${params.toString()}`;
}

export function rekruteSearchUrl(prefs: JobSearchPrefs): string {
  const params = new URLSearchParams();
  const keywords = searchKeywords(prefs);
  if (keywords) {
    params.set("query", keywords);
    params.set("keyword", keywords);
  }
  params.set("s", "1");
  params.set("p", "1");
  params.set("o", "1");
  return `https://www.rekrute.com/offres.html?${params.toString()}`;
}

function wantsFrance(countries: Set<string>): boolean {
  return countries.size === 0 || countries.has("france") || countries.has("europe");
}

function wantsWttj(countries: Set<string>): boolean {
  return (
    countries.size === 0 ||
    countries.has("france") ||
    countries.has("belgique") ||
    countries.has("europe")
  );
}

/** Prefill search on the boards that actually have volume — never scrape them. */
export function applyBoardsForPrefs(prefs: JobSearchPrefs): ApplyBoard[] {
  const keywords = searchKeywords(prefs);
  if (!keywords) return [];

  const countries = countryIds(prefs);
  const boards: ApplyBoard[] = [
    {
      id: "linkedin",
      label: "LinkedIn",
      url: linkedinJobsSearchUrl(prefs),
      featured: true,
    },
    {
      id: "indeed",
      label: "Indeed",
      url: indeedJobsSearchUrl(prefs),
      featured: true,
    },
  ];

  if (wantsWttj(countries)) {
    boards.push({
      id: "wttj",
      label: "WTTJ",
      url: wttjJobsSearchUrl(prefs),
      featured: false,
    });
  }
  if (wantsFrance(countries)) {
    boards.push(
      {
        id: "france-travail",
        label: "France Travail",
        url: franceTravailSearchUrl(prefs),
        featured: false,
      },
      {
        id: "hellowork",
        label: "HelloWork",
        url: helloWorkSearchUrl(prefs),
        featured: false,
      },
    );
  }
  if (countries.has("maroc")) {
    boards.push({
      id: "rekrute",
      label: "Rekrute",
      url: rekruteSearchUrl(prefs),
      featured: false,
    });
  }

  return boards;
}
