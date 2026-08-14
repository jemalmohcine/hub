import { createClient } from "@/core/auth/supabase/server";
import { resolveLocations } from "@/modules/job-board/locations";
import { matchesSearchPrefs } from "@/modules/job-board/match";
import type {
  JobListing,
  JobListingFilter,
  JobSearchPrefs,
} from "@/modules/job-board/types";
import { EMPTY_JOB_SEARCH_PREFS } from "@/modules/job-board/types";

type ListingRow = {
  id: string;
  canonical_key: string;
  source: string;
  external_id: string | null;
  company: string;
  title: string;
  description: string | null;
  url: string;
  employment_category: string;
  freelance_subtype: string | null;
  work_mode: string | null;
  location: string | null;
  salary_hint: string | null;
  tags: string[] | null;
  published_at: string | null;
  scraped_at: string;
};

function rowToListing(row: ListingRow): JobListing {
  return {
    id: row.id,
    canonicalKey: row.canonical_key,
    source: row.source,
    externalId: row.external_id,
    company: row.company,
    title: row.title,
    description: row.description,
    url: row.url,
    employmentCategory: row.employment_category as JobListing["employmentCategory"],
    freelanceSubtype: row.freelance_subtype as JobListing["freelanceSubtype"],
    workMode: (row.work_mode as JobListing["workMode"]) ?? null,
    location: row.location,
    salaryHint: row.salary_hint,
    tags: row.tags ?? [],
    publishedAt: row.published_at,
    scrapedAt: row.scraped_at,
  };
}

function rowToPrefs(data: {
  role_query: string;
  city: string;
  work_mode: string;
  locations?: string[] | null;
}): JobSearchPrefs {
  const fromColumn = Array.isArray(data.locations) ? data.locations : [];
  const fallback = data.city
    ? data.city.split(",").map((part) => part.trim()).filter(Boolean)
    : [];
  return {
    roleQuery: data.role_query as string,
    locations: resolveLocations(fromColumn.length > 0 ? fromColumn : fallback).map(
      (entry) => entry.id,
    ),
    workMode: data.work_mode as JobSearchPrefs["workMode"],
  };
}

export async function getJobSearchPrefs(userId: string): Promise<JobSearchPrefs> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_search_prefs")
    .select("role_query, city, work_mode, locations")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return { ...EMPTY_JOB_SEARCH_PREFS };
  return rowToPrefs(data);
}

export async function saveJobSearchPrefs(
  userId: string,
  prefs: JobSearchPrefs,
): Promise<JobSearchPrefs> {
  const supabase = await createClient();
  const locations = resolveLocations(prefs.locations).map((entry) => entry.id);
  const row = {
    user_id: userId,
    role_query: prefs.roleQuery.trim().slice(0, 80),
    city: locations[0] ?? "",
    locations,
    work_mode: prefs.workMode,
  };
  const { data, error } = await supabase
    .from("job_search_prefs")
    .upsert(row, { onConflict: "user_id" })
    .select("role_query, city, work_mode, locations")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Impossible d’enregistrer la recherche");
  return rowToPrefs(data);
}

export async function listJobListings(
  filter: JobListingFilter = "all",
  query = "",
): Promise<JobListing[]> {
  const supabase = await createClient();

  let dbQuery = supabase
    .from("job_listings")
    .select("*")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("scraped_at", { ascending: false })
    .limit(120);

  if (filter === "salaried") {
    dbQuery = dbQuery.eq("employment_category", "salaried");
  } else if (filter === "freelance_part_time") {
    dbQuery = dbQuery
      .eq("employment_category", "freelance")
      .eq("freelance_subtype", "part_time");
  } else if (filter === "freelance_full_time") {
    dbQuery = dbQuery
      .eq("employment_category", "freelance")
      .eq("freelance_subtype", "full_time");
  }

  const q = query.trim();
  if (q) {
    const safe = q.replace(/[%_]/g, "");
    dbQuery = dbQuery.or(
      `title.ilike.%${safe}%,company.ilike.%${safe}%,description.ilike.%${safe}%`,
    );
  }

  const { data, error } = await dbQuery;
  if (error || !data) return [];
  return (data as ListingRow[]).map(rowToListing);
}

export async function listJobListingsForPrefs(
  prefs: JobSearchPrefs,
): Promise<JobListing[]> {
  const listings = await listJobListings("all");
  if (!prefs.roleQuery.trim()) return [];
  return listings.filter((listing) => matchesSearchPrefs(listing, prefs)).slice(0, 60);
}

export async function getJobListingById(id: string): Promise<JobListing | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return rowToListing(data as ListingRow);
}

export async function getJobListingByUrl(url: string): Promise<JobListing | null> {
  const trimmed = url.trim();
  if (!trimmed) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_listings")
    .select("*")
    .eq("url", trimmed)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return rowToListing(data as ListingRow);
}
