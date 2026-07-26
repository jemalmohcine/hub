import { classifyHit } from "@/modules/ai-intel/classify";
import { buildCanonicalKey } from "@/modules/ai-intel/merge/canonical-key";
import type {
  AiIntelSource,
  ClassifiedItem,
  RawHit,
  SourceRef,
} from "@/modules/ai-intel/types";

export function mergeHits(
  hits: RawHit[],
  sourcesById: Map<string, AiIntelSource>,
): { items: ClassifiedItem[]; stats: { raw: number; merged: number } } {
  const buckets = new Map<
    string,
    { hits: RawHit[]; key: string }
  >();

  for (const hit of hits) {
    const key = buildCanonicalKey(hit);
    const existing = buckets.get(key);
    if (existing) existing.hits.push(hit);
    else buckets.set(key, { key, hits: [hit] });
  }

  const items: ClassifiedItem[] = [];

  for (const bucket of buckets.values()) {
    const ranked = [...bucket.hits].sort((a, b) => {
      const pa = sourcesById.get(a.sourceId)?.priority ?? 0;
      const pb = sourcesById.get(b.sourceId)?.priority ?? 0;
      return pb - pa;
    });
    const primary = ranked[0];
    const source = sourcesById.get(primary.sourceId);
    const { pillar, category, urgency } = classifyHit(
      primary,
      source?.pillar_hints ?? [],
    );

    const sourceRefs: SourceRef[] = ranked.slice(1).map((h) => ({
      sourceId: h.sourceId,
      url: h.url,
      title: h.title,
    }));

    // Deduplicate refs by sourceId
    const seen = new Set<string>();
    const uniqueRefs = sourceRefs.filter((r) => {
      if (seen.has(r.sourceId)) return false;
      seen.add(r.sourceId);
      return true;
    });

    items.push({
      canonicalKey: bucket.key,
      pillar,
      category,
      urgency,
      title: primary.title.trim(),
      summary: primary.summary.trim().slice(0, 600),
      url: primary.url,
      primarySource: primary.sourceId,
      sourceRefs: uniqueRefs,
      publishedAt: primary.publishedAt,
      metadata: {
        confirmations: ranked.length,
        externalIds: ranked.map((h) => h.externalId),
      },
    });
  }

  return {
    items,
    stats: { raw: hits.length, merged: items.length },
  };
}
