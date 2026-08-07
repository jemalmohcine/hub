"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/core/auth/supabase/server";
import { assertEntitled } from "@/core/entitlements/assert-entitled";
import { ENTITLEMENTS } from "@/core/entitlements/keys";
import { getJobListingById } from "@/modules/job-board/queries";
import { scrapeJobOfferPage } from "@/modules/job-board/scrape-offer";
import type { JobApplication } from "@/modules/job-tracker/types";

/** Every action in this file requires the jobs module. */
const requireUser = () => assertEntitled(ENTITLEMENTS.jobs);

function mapApplication(row: {
  id: string;
  company: string;
  role: string;
  status: string;
  job_url: string | null;
  notes: string | null;
  cv_document_id: string | null;
  applied_at: string | null;
  follow_up_at: string | null;
  employment_category: string | null;
  freelance_subtype: string | null;
  listing_id: string | null;
  description: string | null;
  location: string | null;
  salary_hint: string | null;
  created_at: string;
  updated_at: string;
}): JobApplication {
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
    employmentCategory: row.employment_category as JobApplication["employmentCategory"],
    freelanceSubtype: row.freelance_subtype as JobApplication["freelanceSubtype"],
    listingId: row.listing_id,
    description: row.description,
    location: row.location,
    salaryHint: row.salary_hint,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Start tracking an offer: creates a candidature linked to the listing. */
export async function applyToJobListing(
  listingId: string,
  cvDocumentId?: string | null,
): Promise<JobApplication> {
  const user = await requireUser();
  const listing = await getJobListingById(listingId);
  if (!listing) throw new Error("Offre introuvable");

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("job_applications")
    .select("*")
    .eq("user_id", user.id)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (existing) {
    return mapApplication(existing);
  }

  let description = listing.description;
  if (!description || description.length < 200) {
    const scraped = await scrapeJobOfferPage(listing.url);
    if (scraped?.description) description = scraped.description;
  }

  const { data, error } = await supabase
    .from("job_applications")
    .insert({
      user_id: user.id,
      company: listing.company,
      role: listing.title,
      status: "to_apply",
      job_url: listing.url,
      listing_id: listingId,
      employment_category: listing.employmentCategory,
      freelance_subtype: listing.freelanceSubtype,
      description: description?.slice(0, 4000) || null,
      location: listing.location,
      salary_hint: listing.salaryHint,
      cv_document_id: cvDocumentId || null,
      notes: `Source: ${listing.source}`,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/app/career");
  return mapApplication(data);
}

/** Import a job from any URL into the tracker (with scrape). */
export async function importJobFromUrl(
  url: string,
  cvDocumentId?: string | null,
): Promise<JobApplication> {
  const user = await requireUser();
  const scraped = await scrapeJobOfferPage(url);
  if (!scraped?.title) {
    throw new Error("Impossible de lire cette page d’offre");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_applications")
    .insert({
      user_id: user.id,
      company: scraped.company || "Entreprise",
      role: scraped.title,
      status: "to_apply",
      job_url: url,
      description: scraped.description?.slice(0, 4000) || null,
      location: scraped.location,
      salary_hint: scraped.salaryHint,
      cv_document_id: cvDocumentId || null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/app/career");
  return mapApplication(data);
}

export async function markJobApplicationApplied(id: string) {
  const user = await requireUser();
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("job_applications")
    .update({
      status: "applied",
      applied_at: today,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/app/career");
  return mapApplication(data);
}
