import { foldCase } from "@/lib/text";
import { resolveLocations } from "@/modules/job-board/locations";
import {
  locationMatches,
  roleMatches,
} from "@/modules/job-board/match";
import { resolveRoles } from "@/modules/job-board/roles";
import type { JobListing, JobSearchPrefs } from "@/modules/job-board/types";
import { acceptsWorkMode } from "@/modules/job-board/work-modes";

export type JobFitLabel = "excellent" | "good" | "ok";

export type RankedJobListing = JobListing & {
  fitScore: number;
  fitLabel: JobFitLabel;
};

const HARD_SENIOR =
  /\b(staff|principal|distinguished|10\+?\s*(ans|years)|15\+?\s*(ans|years))\b/i;

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

function roleHitsTitle(prefs: JobSearchPrefs, title: string): boolean {
  const roles =
    prefs.roles.length > 0 ? prefs.roles : prefs.roleQuery.trim() ? [prefs.roleQuery] : [];
  if (roles.length === 0) return false;
  return roles.some((role) => roleMatches(role, title));
}

function skillOverlap(listingHay: string, skills: string[]): number {
  if (skills.length === 0) return 0;
  let hits = 0;
  for (const skill of skills) {
    const needle = foldCase(skill);
    if (needle.length < 2) continue;
    if (listingHay.includes(needle)) hits += 1;
    if (hits >= 4) break;
  }
  return hits;
}

/**
 * How close this offer is to the search — and how realistic it is to land.
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
  skills: string[] = [],
): number {
  let score = 0;
  const blob = hay(listing);
  const title = listing.title;
  const selected = resolveLocations(prefs.locations);

  if (roleHitsTitle(prefs, title)) score += 48;
  else if (roleMatches(prefs.roles[0] || prefs.roleQuery, blob)) score += 16;

  const extraRoles = prefs.roles.slice(1);
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

  score += Math.min(20, skillOverlap(blob, skills) * 5);

  const leadRole = resolveRoles(prefs.roles)[0]?.id;
  const isLeadSearch =
    leadRole === "tech-lead" ||
    leadRole === "engineering-manager" ||
    leadRole === "cto";
  if (HARD_SENIOR.test(title) && !isLeadSearch) score -= 28;

  if (prefs.roles.length + (prefs.roleQuery ? 1 : 0) > 0 && !roleHitsTitle(prefs, title)) {
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
  skills: string[] = [],
): RankedJobListing[] {
  return listings
    .map((listing) => {
      const score = scoreListingFit(listing, prefs, skills);
      return { ...listing, fitScore: score, fitLabel: fitLabel(score) };
    })
    .sort((a, b) => b.fitScore - a.fitScore || (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
    .slice(0, 30);
}
