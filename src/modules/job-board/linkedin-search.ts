import { isMoroccoPlace, resolveLocations } from "@/modules/job-board/locations";
import { linkedinSearchKeywords } from "@/modules/job-board/scrape-query";
import type { JobSearchPrefs } from "@/modules/job-board/types";
import { normalizeWorkModes } from "@/modules/job-board/work-modes";

/** Opens the user's own LinkedIn search, already filled with our query. */
export function linkedinJobsSearchUrl(prefs: JobSearchPrefs): string {
  const keywords = linkedinSearchKeywords(prefs);
  const place = resolveLocations(prefs.locations)[0];
  const modes = normalizeWorkModes(prefs);
  const params = new URLSearchParams();
  if (keywords) params.set("keywords", keywords);
  if (place) {
    params.set("location", isMoroccoPlace(place) ? "Morocco" : place.label);
  }
  if (modes.length === 1 && modes[0] === "remote") {
    params.set("f_WT", "2");
  }
  return `https://www.linkedin.com/jobs/search/?${params.toString()}`;
}
