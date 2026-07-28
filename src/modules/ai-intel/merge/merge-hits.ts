import { classifyHit } from "@/modules/ai-intel/classify";
import { buildCanonicalKey } from "@/modules/ai-intel/merge/canonical-key";
import { attachScoreToRaw } from "@/modules/ai-intel/score";
import type {
  AiCategory,
  AiIntelSource,
  AiPillar,
  ClassifiedItem,
  RawHit,
  SourceRef,
} from "@/modules/ai-intel/types";

export function mergeHits(
  hits: RawHit[],
  sourcesById: Map<string, AiIntelSource>,
): { items: ClassifiedItem[]; stats: { raw: number; merged: number } } {
  const buckets = new Map<string, { hits: RawHit[]; key: string }>();

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

    const richest = [...ranked].sort((a, b) => {
      const sa =
        (a.raw?.about as string | undefined)?.length ?? a.summary.length;
      const sb =
        (b.raw?.about as string | undefined)?.length ?? b.summary.length;
      return sb - sa;
    })[0];

    const source = sourcesById.get(richest.sourceId);
    let { pillar, category, urgency } = classifyHit(
      richest,
      source?.pillar_hints ?? [],
    );

    if (richest.raw?.kind === "tool") {
      pillar = "tools" satisfies AiPillar;
      category = "software" satisfies AiCategory;
      urgency = urgency === "urgent" ? urgency : "medium";
    } else if (richest.raw?.kind === "repo") {
      pillar = "opensource" satisfies AiPillar;
      category = "trending_repo" satisfies AiCategory;
      const starsToday = Number(richest.raw.starsToday) || 0;
      urgency =
        starsToday >= 800 ? "urgent" : starsToday >= 150 ? "medium" : urgency;
    }

    const sourceRefs: SourceRef[] = [];
    const seen = new Set<string>();
    for (const h of ranked) {
      if (h.url === richest.url) continue;
      if (seen.has(h.sourceId)) continue;
      seen.add(h.sourceId);
      sourceRefs.push({
        sourceId: h.sourceId,
        url: h.url,
        title: h.title,
      });
    }

    const kind =
      richest.raw?.kind === "tool" || richest.raw?.kind === "repo"
        ? (richest.raw.kind as "tool" | "repo")
        : "news";

    const scoredMeta = attachScoreToRaw(kind, richest.raw ?? {}, {
      title: richest.title.trim(),
      summary: richest.summary,
      urgency,
    });

    // Prefer takeaway as the short card summary when available
    const takeaway =
      typeof scoredMeta.takeaway === "string" ? scoredMeta.takeaway : "";
    const shortSummary = takeaway || richest.summary.trim();

    items.push({
      canonicalKey: bucket.key,
      pillar,
      category,
      urgency,
      title: richest.title.trim(),
      summary: shortSummary.slice(0, 220),
      url: richest.url,
      primarySource: richest.sourceId,
      sourceRefs,
      publishedAt: richest.publishedAt,
      metadata: {
        confirmations: ranked.length,
        externalIds: ranked.map((h) => h.externalId),
        longSummary: richest.summary.trim().slice(0, 700),
        ...scoredMeta,
      },
    });
  }

  return {
    items,
    stats: { raw: hits.length, merged: items.length },
  };
}
