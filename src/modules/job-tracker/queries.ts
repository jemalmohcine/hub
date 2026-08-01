import { createClient } from "@/core/auth/supabase/server";
import type { JobApplication } from "@/modules/job-tracker/types";

type JobRow = {
  id: string;
  company: string;
  role: string;
  status: string;
  job_url: string | null;
  notes: string | null;
  cv_document_id: string | null;
  applied_at: string | null;
  follow_up_at: string | null;
  created_at: string;
  updated_at: string;
};

function rowToJob(row: JobRow): JobApplication {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    status: row.status as JobApplication["status"],
    jobUrl: row.job_url,
    notes: row.notes,
    cvDocumentId: row.cv_document_id,
    appliedAt: row.applied_at,
    followUpAt: row.follow_up_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listJobApplications(userId: string): Promise<JobApplication[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_applications")
    .select(
      "id, company, role, status, job_url, notes, cv_document_id, applied_at, follow_up_at, created_at, updated_at",
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => rowToJob(row as JobRow));
}
