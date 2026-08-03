import { createAdminClient } from "@/core/auth/supabase/admin";
import { buildCanonicalKey, classifyEmployment } from "@/modules/job-board/classify";
import { collectAllJobSources } from "@/modules/job-board/collectors";
import type { RawJobHit } from "@/modules/job-board/types";

function devRelevant(hit: RawJobHit): boolean {
  const blob = `${hit.title} ${hit.description} ${(hit.tags ?? []).join(" ")}`.toLowerCase();
  return /\b(dev|developer|engineer|software|frontend|backend|full[- ]?stack|data|ml|ai|react|node|typescript|python|mobile|ios|android|devops|sre|cloud)\b/.test(
    blob,
  );
}

export async function runJobBoardIngest() {
  const admin = createAdminClient();
  const hits = await collectAllJobSources();
  const relevant = hits.filter(devRelevant);

  let upserted = 0;
  let skipped = 0;
  const sourceStats: Record<string, number> = {};

  for (const hit of relevant) {
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
        location: hit.location || null,
        salary_hint: hit.salaryHint || null,
        tags: hit.tags ?? [],
        published_at: hit.publishedAt || null,
        scraped_at: new Date().toISOString(),
        raw: { tags: hit.tags ?? [] },
      },
      { onConflict: "canonical_key" },
    );

    if (error) {
      skipped += 1;
      continue;
    }
    upserted += 1;
  }

  return {
    raw: hits.length,
    relevant: relevant.length,
    upserted,
    skipped,
    sourceStats,
  };
}
