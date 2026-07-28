import { createAdminClient } from "@/core/auth/supabase/admin";
import { enrichI18nMetadata } from "@/modules/ai-intel/brief";
import type { ClassifiedItem } from "@/modules/ai-intel/types";

/**
 * Re-process existing rows: clean FR/EN takeaways + translate titles once.
 * Does not re-scrape sources.
 */
export async function backfillAiIntelI18n(limit = 120) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ai_intel_items")
    .select("*")
    .order("ingested_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  const rows = data ?? [];
  let updated = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i += 3) {
    const batch = rows.slice(i, i + 3);
    await Promise.all(
      batch.map(async (row) => {
        try {
          const classified: ClassifiedItem = {
            canonicalKey: row.canonical_key as string,
            pillar: row.pillar,
            category: row.category,
            urgency: row.urgency,
            title: row.title as string,
            summary: row.summary as string,
            url: row.url as string,
            primarySource: row.primary_source as string,
            sourceRefs: Array.isArray(row.source_refs) ? row.source_refs : [],
            publishedAt: row.published_at as string | null,
            metadata: (row.metadata ?? {}) as Record<string, unknown>,
          };

          const nextMeta = await enrichI18nMetadata(classified, { force: true });
          const takeaway =
            typeof nextMeta.takeaway === "string"
              ? nextMeta.takeaway
              : row.summary;

          const { error: upErr } = await admin
            .from("ai_intel_items")
            .update({
              summary: String(takeaway).slice(0, 220),
              metadata: nextMeta,
            })
            .eq("id", row.id);

          if (upErr) failed += 1;
          else updated += 1;
        } catch {
          failed += 1;
        }
      }),
    );
  }

  return { scanned: rows.length, updated, failed };
}
