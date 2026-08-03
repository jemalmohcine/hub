import { createClient } from "@/core/auth/supabase/server";
import type { JobListing, JobListingFilter } from "@/modules/job-board/types";

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
    location: row.location,
    salaryHint: row.salary_hint,
    tags: row.tags ?? [],
    publishedAt: row.published_at,
    scrapedAt: row.scraped_at,
  };
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
