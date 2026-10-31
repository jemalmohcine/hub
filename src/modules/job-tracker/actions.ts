"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/core/auth/supabase/server";
import { assertEntitled } from "@/core/entitlements/assert-entitled";
import { ENTITLEMENTS } from "@/core/entitlements/keys";
import { addDaysIso } from "@/lib/dates";
import type {
  JobApplication,
  JobApplicationInput,
  JobApplicationStatus,
} from "@/modules/job-tracker/types";

/** Every action in this file requires the jobs module. */
const requireUser = () => assertEntitled(ENTITLEMENTS.jobs);

function mapRow(data: Record<string, unknown>): JobApplication {
  return {
    id: data.id as string,
    company: data.company as string,
    role: data.role as string,
    status: data.status as JobApplicationStatus,
    jobUrl: data.job_url as string | null,
    notes: data.notes as string | null,
    cvDocumentId: data.cv_document_id as string | null,
    appliedAt: data.applied_at as string | null,
    followUpAt: data.follow_up_at as string | null,
    employmentCategory: (data.employment_category as JobApplication["employmentCategory"]) ?? null,
    freelanceSubtype: (data.freelance_subtype as JobApplication["freelanceSubtype"]) ?? null,
    listingId: (data.listing_id as string | null) ?? null,
    description: (data.description as string | null) ?? null,
    location: (data.location as string | null) ?? null,
    salaryHint: (data.salary_hint as string | null) ?? null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

const SELECT_FIELDS =
  "id, company, role, status, job_url, notes, cv_document_id, applied_at, follow_up_at, employment_category, freelance_subtype, listing_id, description, location, salary_hint, created_at, updated_at";

export async function createJobApplication(input: JobApplicationInput) {
  const user = await requireUser();
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
      employment_category: input.employmentCategory || null,
      freelance_subtype: input.freelanceSubtype || null,
      listing_id: input.listingId || null,
      description: input.description?.trim() || null,
      location: input.location?.trim() || null,
      salary_hint: input.salaryHint?.trim() || null,
    })
    .select(SELECT_FIELDS)
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/app/career");

  return mapRow(data);
}

export async function updateJobApplication(
  id: string,
  input: Partial<JobApplicationInput>,
) {
  const user = await requireUser();
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
  if (input.employmentCategory !== undefined) {
    patch.employment_category = input.employmentCategory || null;
  }
  if (input.freelanceSubtype !== undefined) {
    patch.freelance_subtype = input.freelanceSubtype || null;
  }
  if (input.description !== undefined) patch.description = input.description?.trim() || null;
  if (input.location !== undefined) patch.location = input.location?.trim() || null;
  if (input.salaryHint !== undefined) patch.salary_hint = input.salaryHint?.trim() || null;

  const { error } = await supabase
    .from("job_applications")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/app/career");
}

export async function updateJobStatus(id: string, status: JobApplicationStatus) {
  const patch: Partial<JobApplicationInput> = { status };
  if (status === "applied") {
    patch.appliedAt = addDaysIso(new Date(), 0);
    patch.followUpAt = addDaysIso(new Date(), 7);
  }
  await updateJobApplication(id, patch);
}

export async function snoozeJobFollowUp(id: string, days = 7) {
  await updateJobApplication(id, { followUpAt: addDaysIso(new Date(), days) });
}

export async function deleteJobApplication(id: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("job_applications")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/app/career");
}
