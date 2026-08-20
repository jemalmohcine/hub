import type { JobSearchPrefs, JobWorkMode } from "@/modules/job-board/types";

export const JOB_WORK_MODES: JobWorkMode[] = ["remote", "hybrid", "onsite"];

const ALLOWED = new Set<JobWorkMode>(JOB_WORK_MODES);

export function isJobWorkMode(value: string): value is JobWorkMode {
  return ALLOWED.has(value as JobWorkMode);
}

export function normalizeWorkModes(
  prefs: Pick<JobSearchPrefs, "workModes" | "workMode">,
): JobWorkMode[] {
  const fromArray = (prefs.workModes ?? []).filter(isJobWorkMode);
  const unique = [...new Set(fromArray)];
  if (unique.length > 0) return unique;
  if (prefs.workMode && isJobWorkMode(prefs.workMode)) return [prefs.workMode];
  return ["hybrid"];
}

export function wantsRemote(prefs: Pick<JobSearchPrefs, "workModes" | "workMode">): boolean {
  const modes = normalizeWorkModes(prefs);
  return modes.includes("remote") || modes.includes("hybrid");
}

export function wantsOnsite(prefs: Pick<JobSearchPrefs, "workModes" | "workMode">): boolean {
  const modes = normalizeWorkModes(prefs);
  return modes.includes("onsite") || modes.includes("hybrid");
}

export function onsiteOnly(prefs: Pick<JobSearchPrefs, "workModes" | "workMode">): boolean {
  const modes = normalizeWorkModes(prefs);
  return modes.length === 1 && modes[0] === "onsite";
}

export function acceptsWorkMode(
  prefs: Pick<JobSearchPrefs, "workModes" | "workMode">,
  mode: JobWorkMode | null,
): boolean {
  const selected = normalizeWorkModes(prefs);
  if (!mode) {
    // LinkedIn guest cards have no description. Keep them unless the user
    // only asked for télétravail.
    return selected.includes("onsite") || selected.includes("hybrid");
  }
  if (selected.includes(mode)) return true;
  if (mode === "hybrid" && selected.includes("remote") && selected.includes("onsite")) {
    return true;
  }
  return false;
}
