import { foldCase } from "@/lib/text";

export type JobSeniorityFilter = "any" | "junior" | "mid" | "senior";
export type JobEmploymentFilter = "all" | "salaried" | "freelance";

export type JobSearchFilters = {
  /** Linked CV used as a matching filter. Null = no CV. */
  cvDocumentId: string | null;
  /** Minimum years the user wants to match (0 / 1 / 2 / 3 / 5 / 8). */
  yearsMin: number | null;
  /** Extra title words (React, Python…) on top of the role chips. */
  keyword: string;
  seniority: JobSeniorityFilter;
  /** Keep offers published within this many days. Null = any date. */
  postedWithinDays: number | null;
  employment: JobEmploymentFilter;
};

export const YEARS_MIN_OPTIONS = [0, 1, 2, 3, 5, 8] as const;
export const POSTED_WITHIN_OPTIONS = [7, 30] as const;

export const EMPTY_JOB_SEARCH_FILTERS: JobSearchFilters = {
  cvDocumentId: null,
  yearsMin: null,
  keyword: "",
  seniority: "any",
  postedWithinDays: null,
  employment: "all",
};

export const YEARS_MIN_LABELS: Record<(typeof YEARS_MIN_OPTIONS)[number], string> = {
  0: "0–1 an",
  1: "1 an",
  2: "2 ans",
  3: "3 ans",
  5: "5 ans",
  8: "8 ans et +",
};

export const SENIORITY_LABELS: Record<JobSeniorityFilter, string> = {
  any: "Tous niveaux",
  junior: "Junior / stage",
  mid: "Confirmé",
  senior: "Senior",
};

export const POSTED_WITHIN_LABELS: Record<(typeof POSTED_WITHIN_OPTIONS)[number], string> = {
  7: "7 derniers jours",
  30: "30 derniers jours",
};

export const EMPLOYMENT_FILTER_LABELS: Record<JobEmploymentFilter, string> = {
  all: "Tous contrats",
  salaried: "Salariat",
  freelance: "Freelance",
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SENIORITY = new Set<JobSeniorityFilter>(["any", "junior", "mid", "senior"]);
const EMPLOYMENT = new Set<JobEmploymentFilter>(["all", "salaried", "freelance"]);
const YEARS = new Set<number>(YEARS_MIN_OPTIONS);
const POSTED = new Set<number>(POSTED_WITHIN_OPTIONS);

function asRecord(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as Record<string, unknown>;
}

export function parseCvDocumentId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  return UUID_RE.test(value) ? value : null;
}

export function parseYearsMin(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  const value = typeof raw === "number" ? raw : Number(raw);
  return YEARS.has(value) ? value : null;
}

export function parseSeniority(raw: unknown): JobSeniorityFilter {
  if (typeof raw !== "string") return "any";
  return SENIORITY.has(raw as JobSeniorityFilter) ? (raw as JobSeniorityFilter) : "any";
}

export function parsePostedWithinDays(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  const value = typeof raw === "number" ? raw : Number(raw);
  return POSTED.has(value) ? value : null;
}

export function parseEmploymentFilter(raw: unknown): JobEmploymentFilter {
  if (typeof raw !== "string") return "all";
  return EMPLOYMENT.has(raw as JobEmploymentFilter)
    ? (raw as JobEmploymentFilter)
    : "all";
}

export function parseKeyword(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.trim().replace(/\s+/g, " ").slice(0, 80);
}

export function parseJobSearchFilters(raw: unknown): JobSearchFilters {
  const data = asRecord(raw);
  return {
    cvDocumentId: parseCvDocumentId(data.cvDocumentId),
    yearsMin: parseYearsMin(data.yearsMin),
    keyword: parseKeyword(data.keyword),
    seniority: parseSeniority(data.seniority),
    postedWithinDays: parsePostedWithinDays(data.postedWithinDays),
    employment: parseEmploymentFilter(data.employment),
  };
}

export function filtersToJson(filters: JobSearchFilters): JobSearchFilters {
  return parseJobSearchFilters(filters);
}

/** Snap CV years onto the discrete filter scale (never above the CV). */
export function yearsMinFromExperience(years: number): number {
  if (!Number.isFinite(years) || years < 0) return 0;
  let pick: (typeof YEARS_MIN_OPTIONS)[number] = 0;
  for (const option of YEARS_MIN_OPTIONS) {
    if (years >= option) pick = option;
  }
  return pick;
}

export function keywordTokens(keyword: string): string[] {
  return foldCase(keyword)
    .split(/[^a-z0-9+#]+/)
    .filter((token) => token.length >= 2);
}

export function hasActiveJobFilters(prefs: JobSearchFilters & {
  roles: string[];
  roleQuery: string;
  locations: string[];
}): boolean {
  return (
    prefs.roles.length > 0 ||
    prefs.roleQuery.trim().length >= 2 ||
    prefs.locations.length > 0 ||
    Boolean(prefs.keyword?.trim()) ||
    prefs.yearsMin != null ||
    (prefs.seniority != null && prefs.seniority !== "any") ||
    prefs.postedWithinDays != null ||
    (prefs.employment != null && prefs.employment !== "all") ||
    Boolean(prefs.cvDocumentId)
  );
}
