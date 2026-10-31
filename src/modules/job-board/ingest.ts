import { createAdminClient } from "@/core/auth/supabase/admin";
import { buildCanonicalKey, classifyEmployment } from "@/modules/job-board/classify";
import { collectJobsForPrefs } from "@/modules/job-board/collectors";
import type { CvJobProfile } from "@/modules/job-board/cv-skills";
import { shouldScrapeJobSearch } from "@/modules/job-board/filters";
import { notifyJobFollowUps } from "@/modules/job-board/notify";
import { classifyWorkMode, matchesSearchPrefs } from "@/modules/job-board/match";
import { prefsForScrape } from "@/modules/job-board/scrape-query";
import { purgeExpiredJobOffers, purgeExpiredUserOffers } from "@/modules/job-board/listing-purge";
import type { JobSearchPrefs, RawJobHit } from "@/modules/job-board/types";

function devRelevant(hit: RawJobHit): boolean {
  const blob = `${hit.title} ${hit.description} ${(hit.tags ?? []).join(" ")}`.toLowerCase();
  return /\b(dev|developer|développeur|developpeur|engineer|ingénieur|software|frontend|backend|full[- ]?stack|data|ml|ai|react|node|typescript|python|mobile|ios|android|devops|sre|cloud)\b/.test(
    blob,
  );
}

async function upsertHits(
  hits: RawJobHit[],
  prefs: JobSearchPrefs | null,
  userId?: string,
) {
  const admin = createAdminClient();
  let upserted = 0;
  let skipped = 0;
  const sourceStats: Record<string, number> = {};
  const listingIds: string[] = [];

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

    const { data, error } = await admin
      .from("job_listings")
      .upsert(
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
      )
      .select("id")
      .maybeSingle();

    if (error || !data?.id) {
      skipped += 1;
      continue;
    }
    listingIds.push(data.id as string);
    upserted += 1;
  }

  if (userId && listingIds.length > 0) {
    await attachListingsToUser(userId, listingIds);
  }

  return { upserted, skipped, sourceStats };
}

async function attachListingsToUser(userId: string, listingIds: string[]) {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const rows = listingIds.map((listingId) => ({
    user_id: userId,
    listing_id: listingId,
    scraped_at: now,
  }));
  for (let index = 0; index < rows.length; index += 80) {
    const chunk = rows.slice(index, index + 80);
    const { error } = await admin
      .from("job_user_listings")
      .upsert(chunk, { onConflict: "user_id,listing_id" });
    if (error) {
      console.warn("[jobs] attach user listings", error.message);
      return;
    }
  }
}

export async function ingestJobsForPrefs(
  prefs: JobSearchPrefs,
  options?: { userId?: string; cv?: CvJobProfile | null },
) {
  if (!shouldScrapeJobSearch(prefs)) {
    console.info("[jobs] ingest skipped — no saved search config");
    return { raw: 0, upserted: 0, skipped: 0, sourceStats: {} };
  }
  const queryPrefs = prefsForScrape(prefs, options?.cv);
  const hits = await collectJobsForPrefs(queryPrefs);
  const result = await upsertHits(hits, queryPrefs, options?.userId);
  if (options?.userId) {
    try {
      await purgeExpiredUserOffers(options.userId);
    } catch (err) {
      console.warn("[jobs] purge user offers", err instanceof Error ? err.message : err);
    }
  }
  console.info("[jobs] ingest", {
    roles: queryPrefs.roles,
    locations: queryPrefs.locations,
    keyword: queryPrefs.keyword,
    userId: options?.userId ? "yes" : "no",
    raw: hits.length,
    ...result,
  });
  return { raw: hits.length, ...result };
}

/** Cron: drop stale rows and remind follow-ups. Offers are scraped on demand. */
export async function runJobBoardIngest() {
  const purged = await purgeExpiredJobOffers();
  let followUps = 0;
  try {
    followUps = await notifyJobFollowUps();
  } catch (err) {
    console.warn("[jobs] notify failed", err instanceof Error ? err.message : err);
  }
  console.info("[jobs] maintenance", { purged, followUps });
  return { purged, followUps };
}

