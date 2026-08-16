import { resolveLocations } from "@/modules/job-board/locations";
import { resolveRoles, rolesToQuery } from "@/modules/job-board/roles";
import type { JobSearchPrefs } from "@/modules/job-board/types";
import { normalizeWorkModes } from "@/modules/job-board/work-modes";

const LINKEDIN_WT: Record<string, string> = {
  onsite: "1",
  remote: "2",
  hybrid: "3",
};

/** Opens the user's own LinkedIn search, already filled with our query. */
export function linkedinJobsSearchUrl(prefs: JobSearchPrefs): string {
  const roles = resolveRoles(
    prefs.roles.length > 0 ? prefs.roles : prefs.roleQuery ? [prefs.roleQuery] : [],
  );
  const keywords = rolesToQuery(roles.map((role) => role.id)) || prefs.roleQuery.trim();
  const place = resolveLocations(prefs.locations)[0];
  const modes = normalizeWorkModes(prefs);
  const params = new URLSearchParams();
  if (keywords) params.set("keywords", keywords);
  if (place) params.set("location", place.label);
  if (modes.length === 1) {
    const wt = LINKEDIN_WT[modes[0] ?? ""];
    if (wt) params.set("f_WT", wt);
  }
  return `https://www.linkedin.com/jobs/search/?${params.toString()}`;
}
