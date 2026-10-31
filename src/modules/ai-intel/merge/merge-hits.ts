import { classifyHit, urgencyFromScore } from "@/modules/ai-intel/classify";
import { detectHardSignal } from "@/modules/ai-intel/hard-signals";
import { buildCanonicalKey } from "@/modules/ai-intel/merge/canonical-key";
import { attachScoreToRaw, isOffTopic } from "@/modules/ai-intel/score";
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
): {
  items: ClassifiedItem[];
  stats: { raw: number; merged: number; kept: number; dropped: number };
} {
  const buckets = new Map<string, { hits: RawHit[]; key: string }>();

  for (const hit of hits) {
    const key = buildCanonicalKey(hit);
    const existing = buckets.get(key);
    if (existing) existing.hits.push(hit);
    else buckets.set(key, { key, hits: [hit] });
  }

  const items: ClassifiedItem[] = [];
  let dropped = 0;

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
      if (/\bmcp\b/i.test(`${richest.title} ${richest.summary}`)) {
        category = "mcp" satisfies AiCategory;
      } else if (/\bcli\b/i.test(`${richest.title} ${richest.summary}`)) {
        category = "cli" satisfies AiCategory;
      } else if (/\bsdk\b/i.test(`${richest.title} ${richest.summary}`)) {
        category = "sdk" satisfies AiCategory;
      } else {
        category = "software" satisfies AiCategory;
      }
    } else if (richest.raw?.kind === "repo") {
      pillar = "opensource" satisfies AiPillar;
      category = "trending_repo" satisfies AiCategory;
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

    urgency = urgencyFromScore({
      base: urgency,
      verdict: String(scoredMeta.verdict ?? "skip"),
      score: Number(scoredMeta.score) || 0,
      category,
      kind,
      starsToday: Number(scoredMeta.starsToday) || 0,
    });

    // Nothing is judged on the RSS headline alone: the real scoring happens
    // after the scrape. Only unmistakable off-topic noise is dropped here.
    const headline = `${richest.title} ${richest.summary}`;
    const preSignal = detectHardSignal(headline);
    const preScore = Number(scoredMeta.score) || 0;
    if (!preSignal && isOffTopic(headline) && preScore < 30) {
      dropped += 1;
      continue;
    }

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
        preScore,
        preSignal,
      },
    });
  }

  // Scrape budgets are finite, so the most promising items must be enriched first.
  items.sort((a, b) => enrichPriority(b) - enrichPriority(a));

  return {
    items,
    stats: {
      raw: hits.length,
      merged: buckets.size,
      kept: items.length,
      dropped,
    },
  };
}

/** Who gets the scrape + LLM budget first. */
function enrichPriority(item: ClassifiedItem): number {
  const score = Number(item.metadata.preScore) || 0;
  const signalBoost = item.metadata.preSignal ? 300 : 0;
  const urgencyBoost =
    item.urgency === "urgent" ? 120 : item.urgency === "medium" ? 40 : 0;
  const verdictBoost =
    item.metadata.verdict === "use_it"
      ? 80
      : item.metadata.verdict === "watch"
        ? 20
        : 0;
  const repoBoost = item.pillar === "opensource" && item.metadata.beneficial ? 25 : 0;
  return score + signalBoost + urgencyBoost + verdictBoost + repoBoost;
}
