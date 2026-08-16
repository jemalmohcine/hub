import { foldCase } from "@/lib/text";
import type { CvJobProfile } from "@/modules/job-board/cv-skills";
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
import type { JobListing, JobSearchPrefs } from "@/modules/job-board/types";
import { acceptsWorkMode, wantsRemote } from "@/modules/job-board/work-modes";

export type JobFitLabel = "excellent" | "good" | "ok";

export type RankedJobListing = JobListing & {
  fitScore: number;
  fitLabel: JobFitLabel;
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

export function listingWorthShowing(
  listing: {
    title: string;
    description: string | null;
    location: string | null;
    tags: string[];
    workMode: JobListing["workMode"];
  },
  prefs: JobSearchPrefs,
  cvInput?: string[] | CvFitInput,
): boolean {
  const cv = asFit(cvInput);
  const selected = resolveLocations(prefs.locations);
  const region = wantsRemote(prefs) ? expandWithParentCountries(selected) : selected;
  const mode = listing.workMode;
  if (mode && !acceptsWorkMode(prefs, mode)) return false;
  const remoteEligible = mode !== "onsite";
  if (!placeFitsPrefs(region, listing.location, listing.title, remoteEligible)) {
    return false;
  }

  const roles = searchRoles(prefs, cv);
  if (roleHitsTitle(roles, listing.title)) return true;
  const skills = skillOverlap(hay(listing), cv.skills);
  if (cv.skills.length > 0 && skills >= 1) return true;
  if (roles.length === 0 && cv.skills.length === 0) return true;
  return false;
}

/**
 * How close this offer is to the CV and search — and how realistic it is to land.
 * Higher = show first.
 */
export function scoreListingFit(
  listing: {
    title: string;
    description: string | null;
    location: string | null;
    tags: string[];
    workMode: JobListing["workMode"];
  },
  prefs: JobSearchPrefs,
  cvInput: string[] | CvFitInput = [],
): number {
  const cv = asFit(cvInput);
  let score = 0;
  const blob = hay(listing);
  const title = listing.title;
  const selected = resolveLocations(prefs.locations);
  const roles = searchRoles(prefs, cv);

  if (roleHitsTitle(roles, title)) score += 48;
  else if (roles[0] && roleMatches(roles[0], blob)) score += 16;

  const extraRoles = roles.slice(1);
  if (extraRoles.some((role) => roleMatches(role, title))) score += 8;

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

  score += Math.min(28, skillOverlap(blob, cv.skills) * 4);
  score += seniorityDelta(listing, cv.years);

  const leadRole = resolveRoles(roles)[0]?.id;
  const isLeadSearch =
    leadRole === "tech-lead" ||
    leadRole === "engineering-manager" ||
    leadRole === "cto" ||
    cv.years >= 8;
  if (HARD_SENIOR.test(title) && !isLeadSearch) score -= 28;

  if (roles.length > 0 && !roleHitsTitle(roles, title) && skillOverlap(blob, cv.skills) === 0) {
    score = Math.min(score, 45);
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
      return { ...listing, fitScore: score, fitLabel: fitLabel(score) };
    })
    .sort((a, b) => b.fitScore - a.fitScore || (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
    .slice(0, 40);
}
