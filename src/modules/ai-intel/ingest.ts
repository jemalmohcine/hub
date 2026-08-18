import { createAdminClient } from "@/core/auth/supabase/admin";
import { collectFromSource } from "@/modules/ai-intel/collectors";
import { firecrawlArticleStats } from "@/modules/ai-intel/article-scrape";
import {
  enrichClassifiedItem,
  resetArticleScrapeBudget,
} from "@/modules/ai-intel/enrich-classified";
import { pushAlertTitle } from "@/modules/ai-intel/essential-recap";
import { aiIntelItemHref } from "@/modules/ai-intel/item-link";
import { mergeHits } from "@/modules/ai-intel/merge/merge-hits";
import { buildCriticalPushPayload } from "@/modules/ai-intel/push-digest";
import { isWorthKeeping, preEnrichPriority } from "@/modules/ai-intel/score";
import { scrapeDayIso } from "@/modules/ai-intel/scrape-date";
import {
  timestampsForInsert,
  timestampsForUpdate,
} from "@/modules/ai-intel/item-timestamps";
import { discoverNewSources } from "@/modules/ai-intel/sources/discover";
import type { AiIntelSource, ClassifiedItem, RawHit } from "@/modules/ai-intel/types";
import { isCriticalPushAlert } from "@/modules/ai-intel/ui/rank";
import { mapPool } from "@/lib/async-pool";

const SOURCE_CONCURRENCY = 8;
const ENRICH_CONCURRENCY = 4;
const MAX_IN_APP_ALERTS = 5;

type InsertedIntelItem = ClassifiedItem & { dbId: string };

async function notifyCriticalAlerts(insertedItems: InsertedIntelItem[]) {
  const critical = insertedItems.filter(isCriticalPushAlert);
  if (critical.length === 0) {
    return {
      alerts: 0,
      notifications: 0,
      push: { sent: 0, skipped: true as const, reason: "no_critical" as const },
    };
  }

  const { createNotification } = await import(
    "@/modules/notifications/create"
  );
  const { sendPushBroadcast } = await import("@/modules/notifications/push");

  let notifications = 0;

  for (const item of critical.slice(0, MAX_IN_APP_ALERTS)) {
    const title = pushAlertTitle(item, "fr");
    const body = item.summary.slice(0, 180);
    const href = aiIntelItemHref(item.dbId);

    try {
      await createNotification({
        userId: null,
        category: "ai",
        title,
        body,
        href,
        severity: "urgent",
        dedupeKey: `ai:alert:${item.canonicalKey}`,
        metadata: {
          itemId: item.dbId,
          canonicalKey: item.canonicalKey,
          alertKind: item.category,
        },
        skipPush: true,
      });
      notifications += 1;
    } catch {
      // optional until migration applied
    }
  }

  const payload = buildCriticalPushPayload(critical);
  const push = payload
    ? await sendPushBroadcast(payload, { category: "ai" })
    : { sent: 0, skipped: true as const };

  return {
    alerts: critical.length,
    notifications,
    push: {
      sent: push.sent,
      skipped: "skipped" in push ? push.skipped : false,
      reason: null,
    },
  };
}

export async function runAiIntelIngest() {
  const admin = createAdminClient();
  const startedAt = new Date().toISOString();

  const { data: runRow, error: runErr } = await admin
    .from("ai_intel_runs")
    .insert({
      started_at: startedAt,
      status: "running",
    })
    .select("id")
    .single();

  if (runErr || !runRow) {
    throw new Error(runErr?.message ?? "Failed to create ai_intel_runs row");
  }

  const runId = runRow.id as string;
  const scrapeDay = scrapeDayIso(new Date(startedAt));
  const sourceStats: Record<
    string,
    { ok: boolean; count: number; error?: string }
  > = {};

  try {
    const discovery = await discoverNewSources();

    const { data: sources, error: sourcesErr } = await admin
      .from("ai_intel_sources")
      .select("*")
      .eq("enabled", true)
      .eq("status", "active");

    if (sourcesErr) throw new Error(sourcesErr.message);

    const list = (sources ?? []) as AiIntelSource[];
    const sourcesById = new Map(list.map((s) => [s.id, s]));

    const hitBatches = await mapPool(list, SOURCE_CONCURRENCY, async (source) => {
      try {
        const hits = await collectFromSource(source);
        sourceStats[source.id] = { ok: true, count: hits.length };
        await admin
          .from("ai_intel_sources")
          .update({
            last_ok_at: new Date().toISOString(),
            last_error: null,
          })
          .eq("id", source.id);
        return hits;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        sourceStats[source.id] = { ok: false, count: 0, error: message };
        await admin
          .from("ai_intel_sources")
          .update({ last_error: message.slice(0, 500) })
          .eq("id", source.id);
        return [] as RawHit[];
      }
    });

    const allHits = hitBatches.flat();
    const { items, stats: mergeStats } = mergeHits(allHits, sourcesById);

    resetArticleScrapeBudget();
    const ranked = [...items].sort(
      (a, b) => preEnrichPriority(b) - preEnrichPriority(a),
    );
    const enriched = await mapPool(ranked, ENRICH_CONCURRENCY, (item) =>
      enrichClassifiedItem(item),
    );

    // The real quality filter runs here, once the content has been scraped and
    // read — never on the RSS headline alone.
    const keepers = enriched.filter((item) =>
      isWorthKeeping(item.metadata, Number(item.metadata.confirmations) || 1),
    );
    const droppedAfterEnrich = enriched.length - keepers.length;

    let inserted = 0;
    let refreshed = 0;
    const insertedItems: InsertedIntelItem[] = [];

    const keeperKeys = keepers.map((item) => item.canonicalKey);
    const existingKeys = new Set<string>();
    if (keeperKeys.length > 0) {
      const { data: existingRows } = await admin
        .from("ai_intel_items")
        .select("canonical_key")
        .in("canonical_key", keeperKeys);
      for (const row of existingRows ?? []) {
        existingKeys.add(row.canonical_key as string);
      }
    }

    for (const item of keepers) {
      const row = {
        canonical_key: item.canonicalKey,
        pillar: item.pillar,
        category: item.category,
        urgency: item.urgency,
        title: item.title,
        summary: item.summary,
        url: item.url,
        primary_source: item.primarySource,
        source_refs: item.sourceRefs,
        metadata: item.metadata,
        ...timestampsForInsert(item.publishedAt, scrapeDay),
      };

      if (existingKeys.has(item.canonicalKey)) {
        const { error } = await admin
          .from("ai_intel_items")
          .update({
            pillar: row.pillar,
            category: row.category,
            urgency: row.urgency,
            title: row.title,
            summary: row.summary,
            url: row.url,
            primary_source: row.primary_source,
            source_refs: row.source_refs,
            metadata: row.metadata,
            ...timestampsForUpdate(scrapeDay, item.publishedAt),
          })
          .eq("canonical_key", item.canonicalKey);
        if (!error) refreshed += 1;
        continue;
      }

      const { data, error } = await admin
        .from("ai_intel_items")
        .insert(row)
        .select("id");

      if (error) continue;

      if (data && data.length > 0) {
        inserted += 1;
        insertedItems.push({ ...item, dbId: data[0].id as string });
      }
    }

    const notify = await notifyCriticalAlerts(insertedItems);

    const failures = Object.values(sourceStats).filter((s) => !s.ok).length;
    const status =
      failures === 0
        ? "success"
        : inserted > 0 || Object.values(sourceStats).some((s) => s.ok)
          ? "partial"
          : "failed";

    await admin
      .from("ai_intel_runs")
      .update({
        finished_at: new Date().toISOString(),
        status,
        discovery,
        source_stats: sourceStats,
        merge_stats: {
          ...mergeStats,
          droppedAfterEnrich,
          inserted,
          refreshed,
          notify,
          firecrawl: firecrawlArticleStats(),
        },
      })
      .eq("id", runId);

    return {
      runId,
      status,
      discovery,
      sourceStats,
      mergeStats: {
        ...mergeStats,
        droppedAfterEnrich,
        inserted,
        refreshed,
        notify,
        firecrawl: firecrawlArticleStats(),
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await admin
      .from("ai_intel_runs")
      .update({
        finished_at: new Date().toISOString(),
        status: "failed",
        error: message,
        source_stats: sourceStats,
      })
      .eq("id", runId);
    throw err;
  }
}
