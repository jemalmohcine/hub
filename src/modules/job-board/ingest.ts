import { createAdminClient } from "@/core/auth/supabase/admin";
import { buildCanonicalKey, classifyEmployment } from "@/modules/job-board/classify";
import { collectJobsForPrefs } from "@/modules/job-board/collectors";
import { shouldScrapeJobSearch } from "@/modules/job-board/filters";
import { listingTtlCutoffIso } from "@/modules/job-board/listing-ttl";
import { notifyJobFollowUps } from "@/modules/job-board/notify";
import { classifyWorkMode, matchesSearchPrefs } from "@/modules/job-board/match";
import type { JobSearchPrefs, RawJobHit } from "@/modules/job-board/types";

function devRelevant(hit: RawJobHit): boolean {
  const blob = `${hit.title} ${hit.description} ${(hit.tags ?? []).join(" ")}`.toLowerCase();
  return /\b(dev|developer|développeur|developpeur|engineer|ingénieur|software|frontend|backend|full[- ]?stack|data|ml|ai|react|node|typescript|python|mobile|ios|android|devops|sre|cloud)\b/.test(
    blob,
  );
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

async function purgeStaleListings() {
  const admin = createAdminClient();
  const cutoff = listingTtlCutoffIso();
  const { error, count } = await admin
    .from("job_listings")
    .delete({ count: "exact" })
    .lt("scraped_at", cutoff);
  if (error) {
    console.warn("[jobs] purge stale", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function ingestJobsForPrefs(prefs: JobSearchPrefs) {
  if (!shouldScrapeJobSearch(prefs)) {
    console.info("[jobs] ingest skipped — no saved search config");
    return { raw: 0, upserted: 0, skipped: 0, sourceStats: {} };
  }
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

/** Cron: drop stale rows and remind follow-ups. Offers are scraped on demand. */
export async function runJobBoardIngest() {
  const purged = await purgeStaleListings();
  let followUps = 0;
  try {
    followUps = await notifyJobFollowUps();
  } catch (err) {
    console.warn("[jobs] notify failed", err instanceof Error ? err.message : err);
  }
  console.info("[jobs] maintenance", { purged, followUps });
  return { purged, followUps };
}
