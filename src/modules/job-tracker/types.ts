import type {
  FreelanceSubtype,
  JobEmploymentCategory,
} from "@/modules/job-board/types";

export type JobApplicationStatus =
  | "to_apply"
  | "applied"
  | "interview"
  | "offer"
  | "rejected";

export type JobApplication = {
  id: string;
  company: string;
  role: string;
  status: JobApplicationStatus;
  jobUrl: string | null;
  notes: string | null;
  cvDocumentId: string | null;
  appliedAt: string | null;
  followUpAt: string | null;
  employmentCategory: JobEmploymentCategory | null;
  freelanceSubtype: FreelanceSubtype | null;
  listingId: string | null;
  description: string | null;
  location: string | null;
  salaryHint: string | null;
  createdAt: string;
  updatedAt: string;
};

export type JobApplicationInput = {
  company: string;
  role: string;
  status: JobApplicationStatus;
  jobUrl?: string;
  notes?: string;
  cvDocumentId?: string | null;
  appliedAt?: string | null;
  followUpAt?: string | null;
  employmentCategory?: JobEmploymentCategory | null;
  freelanceSubtype?: FreelanceSubtype | null;
  listingId?: string | null;
  description?: string | null;
  location?: string | null;
  salaryHint?: string | null;
};

export const JOB_STATUS_LABELS: Record<JobApplicationStatus, string> = {
  to_apply: "À postuler",
  applied: "Candidature envoyée",
  interview: "Entretien",
  offer: "Offre",
  rejected: "Refusé",
};

export const JOB_STATUS_ORDER: JobApplicationStatus[] = [
  "to_apply",
  "applied",
  "interview",
  "offer",
  "rejected",
];
