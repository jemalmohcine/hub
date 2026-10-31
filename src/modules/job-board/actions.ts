"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/core/auth/supabase/server";
import { assertEntitled } from "@/core/entitlements/assert-entitled";
import { ENTITLEMENTS } from "@/core/entitlements/keys";
import { addDaysIso } from "@/lib/dates";
import { getCvDocumentById } from "@/modules/cv-builder/queries";
import { profileFromCv } from "@/modules/job-board/cv-skills";
import { MAX_JOB_LOCATIONS, resolveLocations } from "@/modules/job-board/locations";
import { MAX_JOB_ROLES, resolveRoles, rolesToQuery } from "@/modules/job-board/roles";
import { normalizeWorkModes, onsiteOnly } from "@/modules/job-board/work-modes";
import { ingestJobsForPrefs } from "@/modules/job-board/ingest";
import { shouldScrapeJobSearch } from "@/modules/job-board/filters";
import {
  getJobListingById,
  getJobListingByUrl,
  getJobSearchLastScrapedAt,
  getJobSearchPrefs,
  listUserJobListings,
  saveJobSearchPrefs,
  stampJobSearchScrapedAt,
} from "@/modules/job-board/queries";
import { scrapeJobOfferPage } from "@/modules/job-board/scrape-offer";
import { jobScrapeIsDue } from "@/modules/job-board/scrape-schedule";
import type { JobListing, JobSearchPrefs } from "@/modules/job-board/types";
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

export async function saveJobSearchConfig(
  prefs: JobSearchPrefs,
  options?: { scrape?: boolean },
): Promise<{
  prefs: JobSearchPrefs;
  library: JobListing[];
  scraped: boolean;
}> {
  const user = await requireUser();
  const roleQuery = prefs.roleQuery.trim();
  const roles = resolveRoles(prefs.roles.length ? prefs.roles : roleQuery ? [roleQuery] : []);
  if (roles.length > MAX_JOB_ROLES) {
    throw new Error(`Choisis au plus ${MAX_JOB_ROLES} postes.`);
  }
  const workModes = normalizeWorkModes(prefs);
  const locations = resolveLocations(prefs.locations).map((entry) => entry.id);
  if (onsiteOnly(prefs) && locations.length === 0) {
    throw new Error("Pour du présentiel seul, choisis au moins une ville ou un pays.");
  }
  if (locations.length > MAX_JOB_LOCATIONS) {
    throw new Error(`Choisis au plus ${MAX_JOB_LOCATIONS} lieux.`);
  }

  const saved = await saveJobSearchPrefs(user.id, {
    ...prefs,
    roles: roles.map((role) => role.id),
    roleQuery: rolesToQuery(roles.map((role) => role.id)),
    locations,
    workModes,
    workMode: workModes[0] ?? "hybrid",
    cvDocumentId: prefs.cvDocumentId || null,
    keyword: (prefs.keyword ?? "").trim().slice(0, 80),
  });

  let scraped = false;
  if (options?.scrape && shouldScrapeJobSearch(saved)) {
    const cv = saved.cvDocumentId
      ? await getCvDocumentById(user.id, saved.cvDocumentId)
      : null;
    try {
      await ingestJobsForPrefs(saved, {
        userId: user.id,
        cv: profileFromCv(cv),
      });
      await stampJobSearchScrapedAt(user.id);
      scraped = true;
    } catch (err) {
      console.warn(
        "[jobs] live scrape failed",
        err instanceof Error ? err.message : err,
      );
    }
  }

  const library = await listUserJobListings(user.id);
  revalidatePath("/app/career");
  return { prefs: saved, library, scraped };
}

/**
 * Quiet daily refresh: only this user, only with their saved config,
 * only if the last collection was on a previous day. Triggered when they
 * open the app — never a global morning scrape for everyone.
 */
export async function refreshJobOffersIfDue(): Promise<{ scraped: boolean }> {
  const user = await requireUser();
  const prefs = await getJobSearchPrefs(user.id);
  if (!prefs || !shouldScrapeJobSearch(prefs)) {
    return { scraped: false };
  }
  const lastScrapedAt = await getJobSearchLastScrapedAt(user.id);
  if (!jobScrapeIsDue(lastScrapedAt)) {
    return { scraped: false };
  }
  const cv = prefs.cvDocumentId
    ? await getCvDocumentById(user.id, prefs.cvDocumentId)
    : null;
  try {
    await ingestJobsForPrefs(prefs, {
      userId: user.id,
      cv: profileFromCv(cv),
    });
    await stampJobSearchScrapedAt(user.id);
  } catch (err) {
    console.warn(
      "[jobs] silent daily scrape failed",
      err instanceof Error ? err.message : err,
    );
    return { scraped: false };
  }
  revalidatePath("/app/career");
  revalidatePath("/app");
  return { scraped: true };
}

/** Start tracking an offer — no extra scrape, so it stays instant. */
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
      description: listing.description?.slice(0, 4000) || null,
      location: listing.location,
      salary_hint: listing.salaryHint,
      cv_document_id: cvDocumentId || null,
      follow_up_at: addDaysIso(new Date(), 7),
      notes: `Source: ${listing.source}`,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  try {
    const { createNotification } = await import("@/modules/notifications/create");
    await createNotification({
      userId: user.id,
      category: "jobs",
      title: `Suivi · ${listing.company}`,
      body: "On te rappelle de relancer dans 7 jours.",
      href: "/app/career?tab=jobs",
      severity: "info",
      dedupeKey: `jobs:tracked:${user.id}:${listingId}`,
      skipPush: true,
    });
  } catch {
    // jobs category may not be migrated yet
  }

  revalidatePath("/app/career");
  return mapApplication(data);
}

async function findTrackedByUrl(userId: string, url: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("job_applications")
    .select("*")
    .eq("user_id", userId)
    .eq("job_url", url)
    .maybeSingle();
  return data;
}

/** Import a job from any URL into the tracker (listings first, then scrape). */
export async function importJobFromUrl(
  url: string,
  cvDocumentId?: string | null,
): Promise<JobApplication> {
  const user = await requireUser();
  const trimmed = url.trim();
  if (!trimmed.startsWith("http")) {
    throw new Error("Colle un lien http(s) d’offre.");
  }

  const already = await findTrackedByUrl(user.id, trimmed);
  if (already) return mapApplication(already);

  const listing = await getJobListingByUrl(trimmed);
  if (listing) {
    return applyToJobListing(listing.id, cvDocumentId);
  }

  const scraped = await scrapeJobOfferPage(trimmed);
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
      job_url: trimmed,
      description: scraped.description?.slice(0, 4000) || null,
      location: scraped.location,
      salary_hint: scraped.salaryHint,
      cv_document_id: cvDocumentId || null,
      follow_up_at: addDaysIso(new Date(), 7),
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
  const today = addDaysIso(new Date(), 0);

  const { data, error } = await supabase
    .from("job_applications")
    .update({
      status: "applied",
      applied_at: today,
      follow_up_at: addDaysIso(new Date(), 7),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/app/career");
  return mapApplication(data);
}
