import { createClient } from "@/core/auth/supabase/server";
import { resolveLocations } from "@/modules/job-board/locations";
import { matchesSearchPrefs } from "@/modules/job-board/match";
import { resolveRoles, rolesToQuery } from "@/modules/job-board/roles";
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

function missingColumn(error: { message?: string } | null): boolean {
  const message = (error?.message ?? "").toLowerCase();
  return (
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    message.includes("column")
  );
}

function rowToPrefs(data: {
  role_query: string;
  city: string;
  work_mode: string;
  locations?: string[] | null;
  roles?: string[] | null;
}): JobSearchPrefs {
  const fromLocations = Array.isArray(data.locations) ? data.locations : [];
  const fallbackLocations = data.city
    ? data.city.split(",").map((part) => part.trim()).filter(Boolean)
    : [];
  const locations = resolveLocations(
    fromLocations.length > 0 ? fromLocations : fallbackLocations,
  ).map((entry) => entry.id);

  const fromRoles = Array.isArray(data.roles) ? data.roles : [];
  const fallbackRoles = data.role_query
    ? data.role_query.split(/[·,/|]/g).map((part) => part.trim()).filter(Boolean)
    : [];
  const roles = resolveRoles(fromRoles.length > 0 ? fromRoles : fallbackRoles).map(
    (entry) => entry.id,
  );

  return {
    roles,
    roleQuery: rolesToQuery(roles) || data.role_query,
    locations,
    workMode: data.work_mode as JobSearchPrefs["workMode"],
  };
}

export async function getJobSearchPrefs(userId: string): Promise<JobSearchPrefs> {
  const supabase = await createClient();
  const full = await supabase
    .from("job_search_prefs")
    .select("role_query, city, work_mode, locations, roles")
    .eq("user_id", userId)
    .maybeSingle();

  if (!full.error && full.data) return rowToPrefs(full.data);

  const basic = await supabase
    .from("job_search_prefs")
    .select("role_query, city, work_mode")
    .eq("user_id", userId)
    .maybeSingle();

  if (basic.error || !basic.data) return { ...EMPTY_JOB_SEARCH_PREFS };
  return rowToPrefs(basic.data);
}

export async function saveJobSearchPrefs(
  userId: string,
  prefs: JobSearchPrefs,
): Promise<JobSearchPrefs> {
  const supabase = await createClient();
  const locations = resolveLocations(prefs.locations).map((entry) => entry.id);
  const roles = resolveRoles(prefs.roles.length ? prefs.roles : [prefs.roleQuery]).map(
    (entry) => entry.id,
  );
  const roleQuery = (rolesToQuery(roles) || prefs.roleQuery.trim()).slice(0, 240);
  const city = locations.join(",").slice(0, 400);

  const fullRow = {
    user_id: userId,
    role_query: roleQuery,
    city,
    locations,
    roles,
    work_mode: prefs.workMode,
  };

  const attempts: Array<{ row: Record<string, unknown>; columns: string }> = [
    {
      row: fullRow,
      columns: "role_query, city, work_mode, locations, roles",
    },
    {
      row: {
        user_id: userId,
        role_query: roleQuery,
        city,
        locations,
        work_mode: prefs.workMode,
      },
      columns: "role_query, city, work_mode, locations",
    },
    {
      row: {
        user_id: userId,
        role_query: roleQuery.slice(0, 80),
        city: city.slice(0, 80),
        work_mode: prefs.workMode,
      },
      columns: "role_query, city, work_mode",
    },
  ];

  let lastError: { message?: string } | null = null;
  for (const attempt of attempts) {
    const result = await supabase
      .from("job_search_prefs")
      .upsert(attempt.row, { onConflict: "user_id" })
      .select(attempt.columns)
      .single();
    if (!result.error && result.data) {
      return rowToPrefs(result.data as unknown as Parameters<typeof rowToPrefs>[0]);
    }
    lastError = result.error;
    if (!missingColumn(result.error)) break;
  }

  throw new Error(lastError?.message ?? "Impossible d’enregistrer la recherche");
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
  if (!prefs.roleQuery.trim() && prefs.roles.length === 0) return [];
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
