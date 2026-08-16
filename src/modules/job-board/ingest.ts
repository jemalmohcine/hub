import { createAdminClient } from "@/core/auth/supabase/admin";
import { buildCanonicalKey, classifyEmployment } from "@/modules/job-board/classify";
import {
  collectJobsForPrefs,
  DEFAULT_FRANCE_SEARCH,
} from "@/modules/job-board/collectors";
import { resolveLocations } from "@/modules/job-board/locations";
import { classifyWorkMode, matchesSearchPrefs } from "@/modules/job-board/match";
import type { JobSearchPrefs, RawJobHit } from "@/modules/job-board/types";
import { normalizeWorkModes } from "@/modules/job-board/work-modes";

function devRelevant(hit: RawJobHit): boolean {
  const blob = `${hit.title} ${hit.description} ${(hit.tags ?? []).join(" ")}`.toLowerCase();
  return /\b(dev|developer|développeur|developpeur|engineer|ingénieur|software|frontend|backend|full[- ]?stack|data|ml|ai|react|node|typescript|python|mobile|ios|android|devops|sre|cloud)\b/.test(
    blob,
  );
}

function prefsFromRow(row: {
  role_query: string;
  city: string;
  work_mode: string;
  locations?: string[] | null;
  roles?: string[] | null;
  work_modes?: string[] | null;
}): JobSearchPrefs {
  const fromColumn = Array.isArray(row.locations) ? row.locations : [];
  const fallback = row.city
    ? row.city.split(",").map((part) => part.trim()).filter(Boolean)
    : [];
  const fromRoles = Array.isArray(row.roles) ? row.roles : [];
  const fallbackRoles = row.role_query
    ? row.role_query.split(/[·,/|]/g).map((part) => part.trim()).filter(Boolean)
    : [];
  const roles = fromRoles.length > 0 ? fromRoles : fallbackRoles;
  const workModes = normalizeWorkModes({
    workModes: Array.isArray(row.work_modes) ? (row.work_modes as JobSearchPrefs["workModes"]) : [],
    workMode: row.work_mode as JobSearchPrefs["workMode"],
  });
  return {
    roles,
    roleQuery: row.role_query,
    locations: resolveLocations(fromColumn.length > 0 ? fromColumn : fallback).map(
      (entry) => entry.id,
    ),
    workModes,
    workMode: workModes[0] ?? "hybrid",
  };
}

async function upsertHits(hits: RawJobHit[], prefs: JobSearchPrefs | null) {
  const admin = createAdminClient();
  let upserted = 0;
  let skipped = 0;
  const sourceStats: Record<string, number> = {};

  for (const hit of hits) {
    if (!devRelevant(hit)) {
      skipped += 1;
      continue;
    }
    const workMode = classifyWorkMode(hit);
    if (
      prefs &&
      !matchesSearchPrefs(
        {
          title: hit.title,
          description: hit.description,
          location: hit.location ?? null,
          tags: hit.tags ?? [],
          workMode,
        },
        prefs,
      )
    ) {
      skipped += 1;
      continue;
    }

    sourceStats[hit.source] = (sourceStats[hit.source] ?? 0) + 1;
    const { employmentCategory, freelanceSubtype } = classifyEmployment(hit);
    const canonicalKey = buildCanonicalKey(hit);

    const { error } = await admin.from("job_listings").upsert(
      {
        canonical_key: canonicalKey,
        source: hit.source,
        external_id: hit.externalId,
        company: hit.company,
        title: hit.title,
        description: hit.description.slice(0, 4000) || null,
        url: hit.url,
        employment_category: employmentCategory,
        freelance_subtype: freelanceSubtype,
        work_mode: workMode,
        location: hit.location || null,
        salary_hint: hit.salaryHint || null,
        tags: hit.tags ?? [],
        published_at: hit.publishedAt || null,
        scraped_at: new Date().toISOString(),
        raw: { tags: hit.tags ?? [], workMode },
      },
      { onConflict: "canonical_key" },
    );

    if (error) {
      skipped += 1;
      continue;
    }
    upserted += 1;
  }

  return { upserted, skipped, sourceStats };
}

export async function ingestJobsForPrefs(prefs: JobSearchPrefs) {
  const hits = await collectJobsForPrefs(prefs);
  const result = await upsertHits(hits, prefs);
  console.info("[jobs] ingest", {
    roles: prefs.roles,
    locations: prefs.locations,
    raw: hits.length,
    ...result,
  });
  return { raw: hits.length, ...result };
}

export async function runJobBoardIngest() {
  const admin = createAdminClient();
  const full = await admin
    .from("job_search_prefs")
    .select("role_query, city, work_mode, locations, roles, work_modes");
  const prefRows =
    full.data ??
    (
      await admin
        .from("job_search_prefs")
        .select("role_query, city, work_mode, locations, roles")
    ).data ??
    (
      await admin
        .from("job_search_prefs")
        .select("role_query, city, work_mode, locations")
    ).data ??
    (
      await admin.from("job_search_prefs").select("role_query, city, work_mode")
    ).data;

  const unique = new Map<string, JobSearchPrefs>();
  for (const row of prefRows ?? []) {
    const prefs = prefsFromRow(row);
    if (!prefs.roleQuery.trim() && prefs.roles.length === 0) continue;
    unique.set(
      `${prefs.roles.slice().sort().join(",")}|${prefs.locations.slice().sort().join(",")}|${prefs.workModes.slice().sort().join(",")}|${prefs.workMode}`.toLowerCase(),
      prefs,
    );
  }
  if (unique.size === 0) unique.set("default", DEFAULT_FRANCE_SEARCH);

  let raw = 0;
  let upserted = 0;
  let skipped = 0;
  const sourceStats: Record<string, number> = {};

  for (const prefs of unique.values()) {
    const batch = await ingestJobsForPrefs(prefs);
    raw += batch.raw;
    upserted += batch.upserted;
    skipped += batch.skipped;
    for (const [source, count] of Object.entries(batch.sourceStats)) {
      sourceStats[source] = (sourceStats[source] ?? 0) + count;
    }
  }

  return { raw, relevant: upserted, upserted, skipped, sourceStats };
}
