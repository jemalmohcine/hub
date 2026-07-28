import { createAdminClient } from "@/core/auth/supabase/admin";
import { collectFromSource } from "@/modules/ai-intel/collectors";
import { mergeHits } from "@/modules/ai-intel/merge/merge-hits";
import { discoverNewSources } from "@/modules/ai-intel/sources/discover";
import type { AiIntelSource, RawHit } from "@/modules/ai-intel/types";

async function healthCheck(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6_000);
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { "User-Agent": "DevHubAIIntel/1.0" },
    });
    clearTimeout(timer);
    return res.ok || res.status === 304 || res.status === 429;
  } catch {
    return false;
  }
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
  const sourceStats: Record<
    string,
    { ok: boolean; count: number; error?: string; skipped?: boolean }
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
    const allHits: RawHit[] = [];

    await Promise.all(
      list.map(async (source) => {
        const healthy = await healthCheck(source.url);
        if (!healthy) {
          sourceStats[source.id] = {
            ok: false,
            count: 0,
            skipped: true,
            error: "health-check failed",
          };
          await admin
            .from("ai_intel_sources")
            .update({ last_error: "health-check failed" })
            .eq("id", source.id);
          return;
        }

        try {
          const hits = await collectFromSource(source);
          allHits.push(...hits);
          sourceStats[source.id] = { ok: true, count: hits.length };
          await admin
            .from("ai_intel_sources")
            .update({
              last_ok_at: new Date().toISOString(),
              last_error: null,
            })
            .eq("id", source.id);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          sourceStats[source.id] = { ok: false, count: 0, error: message };
          await admin
            .from("ai_intel_sources")
            .update({ last_error: message.slice(0, 500) })
            .eq("id", source.id);
        }
      }),
    );

    const { items, stats: mergeStats } = mergeHits(allHits, sourcesById);

    let upserted = 0;
    const urgentTitles: string[] = [];
    for (const item of items) {
      const { error } = await admin.from("ai_intel_items").upsert(
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
          published_at: item.publishedAt,
          ingested_at: new Date().toISOString(),
        },
        { onConflict: "canonical_key" },
      );
      if (!error) {
        upserted += 1;
        if (item.urgency === "urgent") urgentTitles.push(item.title);
      }
    }

    if (urgentTitles.length > 0) {
      try {
        const { createNotification } = await import(
          "@/modules/notifications/create"
        );
        const day = new Date().toISOString().slice(0, 10);
        await createNotification({
          userId: null,
          category: "ai",
          title: `${urgentTitles.length} info${urgentTitles.length > 1 ? "s" : ""} AI urgente${urgentTitles.length > 1 ? "s" : ""}`,
          body: urgentTitles.slice(0, 3).join(" · "),
          href: "/app/ai",
          severity: "urgent",
          dedupeKey: `ai:urgent:${day}`,
          metadata: { titles: urgentTitles.slice(0, 10) },
        });
      } catch {
        // notifications optional until migration applied
      }
    }

    const failures = Object.values(sourceStats).filter((s) => !s.ok).length;
    const status =
      failures === 0
        ? "success"
        : upserted > 0 || Object.values(sourceStats).some((s) => s.ok)
          ? "partial"
          : "failed";

    await admin
      .from("ai_intel_runs")
      .update({
        finished_at: new Date().toISOString(),
        status,
        discovery,
        source_stats: sourceStats,
        merge_stats: { ...mergeStats, upserted },
      })
      .eq("id", runId);

    return {
      runId,
      status,
      discovery,
      sourceStats,
      mergeStats: { ...mergeStats, upserted },
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
