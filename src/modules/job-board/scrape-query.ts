import type { CvJobProfile } from "@/modules/job-board/cv-skills";
import { yearsMinFromExperience } from "@/modules/job-board/filters";
import {
  isSoftwareFamilyRole,
  resolveRoles,
  rolesToQuery,
} from "@/modules/job-board/roles";
import type { JobSearchPrefs } from "@/modules/job-board/types";

/**
 * Expand the saved config with the linked CV for a scrape only.
 * Does not mutate what we persist: empty role/city fall back to the CV.
 * Skills stay on the CV for ranking — stuffing them into `keyword` would
 * hide Casablanca "Software Engineer" cards that do not name React.
 */
export function prefsForScrape(
  prefs: JobSearchPrefs,
  cv: CvJobProfile | null | undefined,
): JobSearchPrefs {
  if (!cv) return prefs;
  const roles = prefs.roles.length > 0 ? prefs.roles : cv.roles;
  const locations = prefs.locations.length > 0 ? prefs.locations : cv.locations;
  const yearsMin =
    prefs.yearsMin != null
      ? prefs.yearsMin
      : cv.years > 0
        ? yearsMinFromExperience(cv.years)
        : null;
  return {
    ...prefs,
    roles,
    locations,
    roleQuery: rolesToQuery(roles) || prefs.roleQuery,
    yearsMin,
    cvDocumentId: cv.id,
  };
}

/** Precise board queries: role label + optional keyword (React, Python…). */
export function boardSearchQueries(prefs: JobSearchPrefs, max = 2): string[] {
  const roles = resolveRoles(
    prefs.roles.length > 0 ? prefs.roles : prefs.roleQuery.trim() ? [prefs.roleQuery] : [],
  );
  const extra = prefs.keyword.trim();
  const labels = roles.map((role) => role.label).filter((label) => label.length >= 2);
  const queries = labels.map((label) => (extra ? `${label} ${extra}` : label));
  if (queries.length > 0) return [...new Set(queries)].slice(0, max);
  if (extra) return [extra];
  const fallback = prefs.roleQuery.trim();
  return fallback ? [fallback] : [];
}

/**
 * LinkedIn.com guest search. A frontend chip must not become
 * "Développeur frontend React" — that misses "Full Stack Developer" in Casablanca.
 */
export function linkedinSearchKeywords(prefs: JobSearchPrefs): string {
  const extra = prefs.keyword.trim();
  if (extra) return boardSearchQueries(prefs, 1)[0] || extra;
  const roles = resolveRoles(
    prefs.roles.length > 0 ? prefs.roles : prefs.roleQuery.trim() ? [prefs.roleQuery] : [],
  );
  if (roles.some((role) => isSoftwareFamilyRole(role.id))) return "développeur";
  return boardSearchQueries(prefs, 1)[0] || "développeur";
}
