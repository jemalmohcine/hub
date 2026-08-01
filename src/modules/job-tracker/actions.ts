"use server";

import { revalidatePath } from "next/cache";
import { getHubUser } from "@/core/auth/get-user";
import { createClient } from "@/core/auth/supabase/server";
import { hasEntitlement } from "@/core/entitlements";
import type {
  JobApplicationInput,
  JobApplicationStatus,
} from "@/modules/job-tracker/types";

function assertEntitled() {
  const user = getHubUser();
  return user.then((u) => {
    if (!u) throw new Error("Unauthorized");
    if (!hasEntitlement(u.entitlements, "module:jobs")) {
      throw new Error("Pro entitlement required");
    }
    return u;
  });
}

export async function createJobApplication(input: JobApplicationInput) {
  const user = await assertEntitled();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("job_applications")
    .insert({
      user_id: user.id,
      company: input.company.trim(),
      role: input.role.trim(),
      status: input.status,
      job_url: input.jobUrl?.trim() || null,
      notes: input.notes?.trim() || null,
      cv_document_id: input.cvDocumentId || null,
      applied_at: input.appliedAt || null,
      follow_up_at: input.followUpAt || null,
    })
    .select(
      "id, company, role, status, job_url, notes, cv_document_id, applied_at, follow_up_at, created_at, updated_at",
    )
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/app/jobs");

  return {
    id: data.id,
    company: data.company,
    role: data.role,
    status: data.status as JobApplicationInput["status"],
    jobUrl: data.job_url,
    notes: data.notes,
    cvDocumentId: data.cv_document_id,
    appliedAt: data.applied_at,
    followUpAt: data.follow_up_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateJobApplication(
  id: string,
  input: Partial<JobApplicationInput>,
) {
  const user = await assertEntitled();
  const supabase = await createClient();

  const patch: Record<string, unknown> = {};
  if (input.company !== undefined) patch.company = input.company.trim();
  if (input.role !== undefined) patch.role = input.role.trim();
  if (input.status !== undefined) patch.status = input.status;
  if (input.jobUrl !== undefined) patch.job_url = input.jobUrl?.trim() || null;
  if (input.notes !== undefined) patch.notes = input.notes?.trim() || null;
  if (input.cvDocumentId !== undefined) patch.cv_document_id = input.cvDocumentId || null;
  if (input.appliedAt !== undefined) patch.applied_at = input.appliedAt || null;
  if (input.followUpAt !== undefined) patch.follow_up_at = input.followUpAt || null;

  const { error } = await supabase
    .from("job_applications")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/app/jobs");
}

export async function updateJobStatus(id: string, status: JobApplicationStatus) {
  await updateJobApplication(id, { status });
}

export async function deleteJobApplication(id: string) {
  const user = await assertEntitled();
  const supabase = await createClient();

  const { error } = await supabase
    .from("job_applications")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/app/jobs");
}
