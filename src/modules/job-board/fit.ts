import { daysBetween } from "@/lib/dates";
import { foldCase } from "@/lib/text";
import type { CvJobProfile } from "@/modules/job-board/cv-skills";
import { keywordTokens, parseJobSearchFilters } from "@/modules/job-board/filters";
import { resolveLocations } from "@/modules/job-board/locations";
import {
  locationMatches,
  placeFitsPrefs,
  regionForPrefs,
  roleMatches,
} from "@/modules/job-board/match";
import { resolveRoles } from "@/modules/job-board/roles";
import { isTrendingListing } from "@/modules/job-board/trending";
import type { JobListing, JobSearchPrefs } from "@/modules/job-board/types";
import { acceptsWorkMode } from "@/modules/job-board/work-modes";

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

function isLeadSearch(roles: string[], years: number): boolean {
  const leadRole = resolveRoles(roles)[0]?.id;
  return (
    leadRole === "tech-lead" ||
    leadRole === "engineering-manager" ||
    leadRole === "cto" ||
    years >= 8
  );
}

/** How realistic the seniority ask is — the main “will they take you” lever. */
function seniorityChancePoints(
  listing: { title: string; description: string | null; tags: string[] },
  years: number,
): number {
  if (years <= 0) return 12;
  const asked = listingAskedYears(listing);
  const blob = `${listing.title} ${listing.description ?? ""}`;
  let points = 12;
  if (asked != null) {
    if (years + 1 < asked) points = 0;
    else if (years >= asked && years <= asked + 3) points = 18;
    else if (years >= asked) points = 14;
    else points = 8;
  }
  if (HARD_SENIOR.test(blob) && years < 6) return Math.min(points, 2);
  if (SENIOR_HINT.test(blob) && years < 3) return Math.min(points, 4);
  if (JUNIOR_HINT.test(blob) && years >= 7) return Math.min(points, 6);
  if (JUNIOR_HINT.test(blob) && years <= 3) return Math.max(points, 16);
  return points;
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
  const region = regionForPrefs(prefs);
  const mode = listing.workMode;
  if (!acceptsWorkMode(prefs, mode)) return false;
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
 * Chance of being taken on this offer, 0–100.
 * Role + stack + years + city — not recency, not “the board is trendy”.
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
  const blob = hay(listing);
  const titleHay = foldCase(listing.title);
  const selected = resolveLocations(prefs.locations);
  const roles = searchRoles(prefs, cv);
  const years = effectiveYears(prefs, cv) ?? 0;
  const asked = listingAskedYears(listing);
  const skillsHit = skillOverlap(blob, cv.skills);
  const titleSkillHits = skillOverlap(titleHay, cv.skills);

  let rolePts = 0;
  if (roleHitsTitle(roles, listing.title)) rolePts = 30;
  else if (roles[0] && roleMatches(roles[0], blob)) rolePts = 10;
  if (roles.slice(1).some((role) => roleMatches(role, listing.title))) {
    rolePts = Math.min(34, rolePts + 4);
  }

  let skillPts = 0;
  if (cv.skills.length > 0) {
    skillPts = Math.min(28, skillsHit * 8) + Math.min(8, titleSkillHits * 6);
  }

  let keywordPts = 0;
  if (keywordTokens(extra.keyword).length > 0 && listingMatchesKeyword(listing, extra.keyword)) {
    keywordPts = 10;
  }

  let placePts = 8;
  if (selected.length > 0) {
    const cities = selected.filter((entry) => entry.kind === "city");
    const countries = selected.filter((entry) => entry.kind !== "city");
    if (cities.some((entry) => locationMatches(entry, listing.location, listing.title))) {
      placePts = 14;
    } else if (countries.some((entry) => locationMatches(entry, listing.location, listing.title))) {
      placePts = 6;
    } else {
      placePts = 2;
    }
  }

  const seniorPts = seniorityChancePoints(listing, years);
  let score = rolePts + skillPts + keywordPts + placePts + seniorPts;

  if (HARD_SENIOR.test(listing.title) && !isLeadSearch(roles, years)) {
    score = Math.min(score, 38);
  }
  if (asked != null && years > 0 && years + 1 < asked) {
    score = Math.min(score, 34);
  }
  if (cv.skills.length > 0 && skillsHit === 0) {
    score = Math.min(score, roleHitsTitle(roles, listing.title) ? 58 : 40);
  }
  if (roles.length > 0 && !roleHitsTitle(roles, listing.title) && skillsHit === 0) {
    score = Math.min(score, 42);
  }

  return Math.max(0, Math.min(100, score));
}

export function fitLabel(score: number): JobFitLabel {
  if (score >= 70) return "excellent";
  if (score >= 50) return "good";
  return "ok";
}

export function fitChanceCopy(score: number): {
  label: string;
  tone: "success" | "brand" | "neutral";
} {
  if (score >= 70) return { label: "Forte chance", tone: "success" };
  if (score >= 50) return { label: "Bonne chance", tone: "brand" };
  return { label: "Plus faible", tone: "neutral" };
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
    .slice(0, 80);
}
