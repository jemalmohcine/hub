import { createAdminClient } from "@/core/auth/supabase/admin";
import { collectFromSource } from "@/modules/ai-intel/collectors";
import { mergeHits } from "@/modules/ai-intel/merge/merge-hits";
import { scrapeDayIso } from "@/modules/ai-intel/scrape-date";
import { discoverNewSources } from "@/modules/ai-intel/sources/discover";
import type { AiIntelSource, RawHit } from "@/modules/ai-intel/types";
import { mapPool } from "@/lib/async-pool";

const SOURCE_CONCURRENCY = 8;

async function notifyAiDigest(input: {
  inserted: number;
  urgentCount: number;
  sampleTitles: string[];
}) {
  if (input.inserted <= 0) {
    return {
      notification: false,
      push: { sent: 0, skipped: true, reason: "no_items" as const },
    };
  }

  const day = new Date().toISOString().slice(0, 10);
  const urgent = input.urgentCount;
  const title =
    urgent > 0
      ? `${urgent} alerte${urgent > 1 ? "s" : ""} AI · ${input.inserted} nouveauté${input.inserted > 1 ? "s" : ""}`
      : `${input.inserted} nouvelle${input.inserted > 1 ? "s" : ""} info${input.inserted > 1 ? "s" : ""} AI`;
  const body = input.sampleTitles.slice(0, 3).join(" · ");

  let notification = false;
  try {
    const { createNotification } = await import(
      "@/modules/notifications/create"
    );
    await createNotification({
      userId: null,
      category: "ai",
      title,
      body,
      href: "/app/ai",
      severity: urgent > 0 ? "urgent" : "info",
      dedupeKey: `ai:digest:${day}`,
      metadata: {
        inserted: input.inserted,
        urgent,
        titles: input.sampleTitles.slice(0, 10),
      },
      skipPush: true,
    });
    notification = true;
  } catch {
    // hub_notifications optional until migration applied
  }

  const { sendPushBroadcast } = await import("@/modules/notifications/push");
  const push = await sendPushBroadcast(
    {
      title,
      body,
      href: "/app/ai",
      tag: `ai:digest:${day}`,
      severity: urgent > 0 ? "urgent" : "info",
    },
    { category: "ai" },
  );

  return { notification, push };
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

    let inserted = 0;
    let skipped = 0;
    let urgentCount = 0;
    const sampleTitles: string[] = [];

    for (const item of items) {
      const { data, error } = await admin
        .from("ai_intel_items")
        .upsert(
          {
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
            published_at: scrapeDay,
            ingested_at: scrapeDay,
          },
          { onConflict: "canonical_key", ignoreDuplicates: true },
        )
        .select("id");

      if (error) continue;

      if (data && data.length > 0) {
        inserted += 1;
        sampleTitles.push(item.title);
        if (item.urgency === "urgent") urgentCount += 1;
      } else {
        skipped += 1;
      }
    }

    const notify = await notifyAiDigest({
      inserted,
      urgentCount,
      sampleTitles,
    });

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
        merge_stats: { ...mergeStats, inserted, skipped, notify },
      })
      .eq("id", runId);

    return {
      runId,
      status,
      discovery,
      sourceStats,
      mergeStats: { ...mergeStats, inserted, skipped, notify },
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
