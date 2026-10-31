import {
  EMPTY_JOB_SEARCH_FILTERS,
  type JobSearchFilters,
} from "@/modules/job-board/filters";

export type JobEmploymentCategory = "salaried" | "freelance";

export type FreelanceSubtype = "part_time" | "full_time";

export type JobWorkMode = "remote" | "hybrid" | "onsite";

export type JobListing = {
  id: string;
  canonicalKey: string;
  source: string;
  externalId: string | null;
  company: string;
  title: string;
  description: string | null;
  url: string;
  employmentCategory: JobEmploymentCategory;
  freelanceSubtype: FreelanceSubtype | null;
  workMode: JobWorkMode | null;
  location: string | null;
  salaryHint: string | null;
  tags: string[];
  publishedAt: string | null;
  scrapedAt: string;
};

export type JobSearchPrefs = {
  /** Catalog ids (or custom labels) — multi-select. */
  roles: string[];
  /** Joined labels, kept for collectors / matching. */
  roleQuery: string;
  /** Catalog ids (cities / countries), multi-select. */
  locations: string[];
  /** Télétravail / hybride / présentiel — multi-select. */
  workModes: JobWorkMode[];
  /** First selected mode, kept for older rows / collectors. */
  workMode: JobWorkMode;
} & JobSearchFilters;

export type JobListingFilter =
  | "all"
  | "salaried"
  | "freelance_part_time"
  | "freelance_full_time";

export type RawJobHit = {
  source: string;
  externalId: string;
  company: string;
  title: string;
  description: string;
  url: string;
  location?: string;
  salaryHint?: string;
  tags?: string[];
  publishedAt?: string | null;
  workMode?: JobWorkMode | null;
};

export const EMPLOYMENT_CATEGORY_LABELS: Record<JobEmploymentCategory, string> = {
  salaried: "Salariat",
  freelance: "Freelance",
};

export const FREELANCE_SUBTYPE_LABELS: Record<FreelanceSubtype, string> = {
  part_time: "Temps partiel",
  full_time: "Full-time",
};

export const WORK_MODE_LABELS: Record<JobWorkMode, string> = {
  remote: "Télétravail",
  hybrid: "Hybride",
  onsite: "Présentiel",
};

export const JOB_LISTING_FILTER_LABELS: Record<JobListingFilter, string> = {
  all: "Toutes",
  salaried: "Salariat",
  freelance_part_time: "Freelance · temps partiel",
  freelance_full_time: "Freelance · full-time",
};

export const EMPTY_JOB_SEARCH_PREFS: JobSearchPrefs = {
  roles: [],
  roleQuery: "",
  locations: [],
  workModes: ["remote", "hybrid", "onsite"],
  workMode: "hybrid",
  ...EMPTY_JOB_SEARCH_FILTERS,
};

export function withJobSearchPrefs(partial: Partial<JobSearchPrefs> = {}): JobSearchPrefs {
  return { ...EMPTY_JOB_SEARCH_PREFS, ...partial };
}

