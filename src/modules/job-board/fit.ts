import { daysBetween } from "@/lib/dates";
import { foldCase } from "@/lib/text";
import type { CvJobProfile } from "@/modules/job-board/cv-skills";
import { keywordTokens, parseJobSearchFilters } from "@/modules/job-board/filters";
import {
  expandWithParentCountries,
  resolveLocations,
} from "@/modules/job-board/locations";
import {
  locationMatches,
  placeFitsPrefs,
  roleMatches,
} from "@/modules/job-board/match";
import { resolveRoles } from "@/modules/job-board/roles";
import { listingHeatScore, isTrendingListing } from "@/modules/job-board/trending";
import type { JobListing, JobSearchPrefs } from "@/modules/job-board/types";
import { acceptsWorkMode, wantsRemote } from "@/modules/job-board/work-modes";

export type JobFitLabel = "excellent" | "good" | "ok";

export type RankedJobListing = JobListing & {
  fitScore: number;
  fitLabel: JobFitLabel;
  trending: boolean;
};

export type CvFitInput = Pick<CvJobProfile, "skills" | "years" | "roles">;

const HARD_SENIOR =
  /\b(staff|principal|distinguished|10\+?\s*(ans|years)|15\+?\s*(ans|years)|head of engineering)\b/i;
const SENIOR_HINT = /\b(senior|confirmé|confirme|5\+\s*(ans|years)|6\+\s*(ans|years))\b/i;
const JUNIOR_HINT =
  /\b(junior|intern|internship|stage|alternance|graduate|first job|0[-–]2\s*(ans|years))\b/i;

function hay(listing: {
  title: string;
  description: string | null;
  location: string | null;
  tags: string[];
}): string {
  return foldCase(
    `${listing.title} ${listing.description ?? ""} ${listing.location ?? ""} ${listing.tags.join(" ")}`,
  );
}

function asFit(input: string[] | CvFitInput | undefined): CvFitInput {
  if (!input) return { skills: [], years: 0, roles: [] };
  if (Array.isArray(input)) return { skills: input, years: 0, roles: [] };
  return input;
}

function searchRoles(prefs: JobSearchPrefs, cv: CvFitInput): string[] {
  if (prefs.roles.length > 0) return prefs.roles;
  if (cv.roles.length > 0) return cv.roles;
  return prefs.roleQuery.trim() ? [prefs.roleQuery] : [];
}

function roleHitsTitle(roles: string[], title: string): boolean {
  if (roles.length === 0) return false;
  return roles.some((role) => roleMatches(role, title));
}

function skillOverlap(listingHay: string, skills: string[]): number {
  if (skills.length === 0) return 0;
  let hits = 0;
  for (const skill of skills) {
    const needle = foldCase(skill);
    if (needle.length < 2) continue;
    if (needle.length === 2 && needle !== "go" && needle !== "c#" && needle !== "qt") continue;
    if (listingHay.includes(needle)) hits += 1;
    if (hits >= 8) break;
  }
  return hits;
}

export function listingAskedYears(listing: {
  title: string;
  description: string | null;
  tags: string[];
}): number | null {
  const tagged = listing.tags.find((tag) => /^exp-min-\d+$/i.test(tag));
  if (tagged) {
    const years = Number(tagged.slice("exp-min-".length));
    return Number.isFinite(years) ? years : null;
  }
  const blob = `${listing.title} ${listing.description ?? ""}`;
  const plus = blob.match(/\b(\d{1,2})\s*\+\s*(ans|years)\b/i);
  if (plus) return Number(plus[1]);
  const range = blob.match(/\b(\d{1,2})\s*[-–]\s*(\d{1,2})\s*(ans|years)\b/i);
  if (range) return Number(range[1]);
  const single = blob.match(/\b(\d{1,2})\s*(ans|years)(?:\s+d['’e ]expérience|\s+of experience)?\b/i);
  if (single) return Number(single[1]);
  return null;
}

function seniorityDelta(listing: { title: string; description: string | null; tags: string[] }, years: number): number {
  if (years <= 0) return 0;
  const asked = listingAskedYears(listing);
  const blob = `${listing.title} ${listing.description ?? ""}`;
  let delta = 0;
  if (asked != null) {
    if (years + 1 < asked) delta -= 30;
    else if (years >= asked) delta += 12;
  }
  if (HARD_SENIOR.test(blob) && years < 6) delta -= 32;
  else if (SENIOR_HINT.test(blob) && years < 3) delta -= 20;
  else if (JUNIOR_HINT.test(blob) && years >= 7) delta -= 22;
  else if (JUNIOR_HINT.test(blob) && years <= 3) delta += 10;
  return delta;
}

function effectiveYears(prefs: JobSearchPrefs, cv: CvFitInput): number | null {
  const yearsMin = parseJobSearchFilters(prefs).yearsMin;
  if (yearsMin != null) return yearsMin;
  if (cv.years > 0) return cv.years;
  return null;
}

function listingMatchesKeyword(
  listing: { title: string; company?: string },
  keyword: string,
): boolean {
  const tokens = keywordTokens(keyword);
  if (tokens.length === 0) return true;
  const blob = foldCase(`${listing.title} ${listing.company ?? ""}`);
  return tokens.every((token) => blob.includes(token));
}

function listingMatchesYears(
  listing: { title: string; description: string | null; tags: string[] },
  years: number | null,
): boolean {
  if (years == null) return true;
  const asked = listingAskedYears(listing);
  const blob = `${listing.title} ${listing.description ?? ""}`;
  if (asked != null && asked > years + 1) return false;
  if (HARD_SENIOR.test(blob) && years < 6) return false;
  if (SENIOR_HINT.test(blob) && years < 3) return false;
  if (JUNIOR_HINT.test(blob) && years >= 7) return false;
  return true;
}

function listingMatchesSeniority(
  listing: { title: string; description: string | null; tags: string[] },
  seniority: JobSearchPrefs["seniority"],
): boolean {
  if (seniority === "any") return true;
  const blob = `${listing.title} ${listing.description ?? ""}`;
  const asked = listingAskedYears(listing);
  if (seniority === "junior") {
    if (HARD_SENIOR.test(blob) || SENIOR_HINT.test(blob)) return false;
    if (asked != null && asked >= 5) return false;
    return true;
  }
  if (seniority === "mid") {
    if (HARD_SENIOR.test(blob) || JUNIOR_HINT.test(blob)) return false;
    if (asked != null && (asked < 2 || asked >= 8)) return false;
    return true;
  }
  if (JUNIOR_HINT.test(blob)) return false;
  if (asked != null && asked < 3) return false;
  return true;
}

function listingMatchesRecency(
  publishedAt: string | null | undefined,
  days: number | null,
  now = Date.now(),
): boolean {
  if (days == null) return true;
  if (!publishedAt) return true;
  return daysBetween(publishedAt, now) <= days;
}

function listingMatchesEmployment(
  category: JobListing["employmentCategory"] | undefined,
  employment: JobSearchPrefs["employment"],
): boolean {
  if (employment === "all" || !category) return true;
  return category === employment;
}

export function listingWorthShowing(
  listing: {
    title: string;
    company?: string;
    description: string | null;
    location: string | null;
    tags: string[];
    workMode: JobListing["workMode"];
    employmentCategory?: JobListing["employmentCategory"];
    publishedAt?: string | null;
  },
  prefs: JobSearchPrefs,
  cvInput?: string[] | CvFitInput,
): boolean {
  const cv = asFit(cvInput);
  const extra = parseJobSearchFilters(prefs);
  const selected = resolveLocations(prefs.locations);
  const region = wantsRemote(prefs) ? expandWithParentCountries(selected) : selected;
  const mode = listing.workMode;
  if (mode && !acceptsWorkMode(prefs, mode)) return false;
  const remoteEligible = mode !== "onsite";
  if (!placeFitsPrefs(region, listing.location, listing.title, remoteEligible)) {
    return false;
  }
  if (!listingMatchesKeyword(listing, extra.keyword)) return false;
  if (!listingMatchesYears(listing, effectiveYears(prefs, cv))) return false;
  if (!listingMatchesSeniority(listing, extra.seniority)) return false;
  if (!listingMatchesRecency(listing.publishedAt, extra.postedWithinDays)) return false;
  if (!listingMatchesEmployment(listing.employmentCategory, extra.employment)) {
    return false;
  }

  const prefRoles =
    prefs.roles.length > 0 ? prefs.roles : prefs.roleQuery.trim() ? [prefs.roleQuery] : [];
  const roles = searchRoles(prefs, cv);
  if (prefRoles.length > 0) {
    return roleHitsTitle(prefRoles, listing.title);
  }
  if (roles.length > 0) {
    return roleHitsTitle(roles, listing.title);
  }
  if (cv.skills.length > 0) {
    return skillOverlap(hay(listing), cv.skills) >= 1;
  }
  return true;
}

/**
 * How close this offer is to the CV and search — and how realistic it is to land.
 * Higher = show first.
 */
export function scoreListingFit(
  listing: {
    title: string;
    company?: string;
    description: string | null;
    location: string | null;
    tags: string[];
    workMode: JobListing["workMode"];
    source?: string;
    publishedAt?: string | null;
    scrapedAt?: string;
  },
  prefs: JobSearchPrefs,
  cvInput: string[] | CvFitInput = [],
): number {
  const cv = asFit(cvInput);
  const extra = parseJobSearchFilters(prefs);
  let score = 0;
  const blob = hay(listing);
  const title = listing.title;
  const selected = resolveLocations(prefs.locations);
  const roles = searchRoles(prefs, cv);
  const years = effectiveYears(prefs, cv) ?? 0;

  if (roleHitsTitle(roles, title)) score += 48;
  else if (roles[0] && roleMatches(roles[0], blob)) score += 16;

  const extraRoles = roles.slice(1);
  if (extraRoles.some((role) => roleMatches(role, title))) score += 8;

  if (listingMatchesKeyword(listing, extra.keyword) && keywordTokens(extra.keyword).length > 0) {
    score += 18;
  }

  if (selected.length > 0) {
    const cities = selected.filter((entry) => entry.kind === "city");
    const countries = selected.filter((entry) => entry.kind !== "city");
    if (cities.some((entry) => locationMatches(entry, listing.location, title))) {
      score += 28;
    } else if (
      countries.some((entry) => locationMatches(entry, listing.location, title))
    ) {
      score += 12;
    }
  }

  if (listing.workMode && acceptsWorkMode(prefs, listing.workMode)) score += 8;

  const skillsHit = skillOverlap(blob, cv.skills);
  score += Math.min(cv.skills.length > 0 ? 36 : 28, skillsHit * (cv.skills.length > 0 ? 6 : 4));
  if (cv.skills.length > 0 && skillsHit === 0) score -= 16;
  score += seniorityDelta(listing, years);

  const leadRole = resolveRoles(roles)[0]?.id;
  const isLeadSearch =
    leadRole === "tech-lead" ||
    leadRole === "engineering-manager" ||
    leadRole === "cto" ||
    years >= 8;
  if (HARD_SENIOR.test(title) && !isLeadSearch) score -= 28;

  if (roles.length > 0 && !roleHitsTitle(roles, title) && skillOverlap(blob, cv.skills) === 0) {
    score = Math.min(score, 45);
  }

  if (listing.source && (listing.publishedAt || listing.scrapedAt)) {
    score += listingHeatScore({
      source: listing.source,
      publishedAt: listing.publishedAt ?? null,
      scrapedAt: listing.scrapedAt ?? listing.publishedAt ?? "",
    });
  }

  return Math.max(0, Math.min(100, score));
}

export function fitLabel(score: number): JobFitLabel {
  if (score >= 72) return "excellent";
  if (score >= 52) return "good";
  return "ok";
}

export function rankListingsForPrefs(
  listings: JobListing[],
  prefs: JobSearchPrefs,
  cvInput: string[] | CvFitInput = [],
): RankedJobListing[] {
  return listings
    .filter((listing) => listingWorthShowing(listing, prefs, cvInput))
    .map((listing) => {
      const score = scoreListingFit(listing, prefs, cvInput);
      return {
        ...listing,
        fitScore: score,
        fitLabel: fitLabel(score),
        trending: isTrendingListing(listing),
      };
    })
    .sort((a, b) => b.fitScore - a.fitScore || (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
    .slice(0, 40);
}
