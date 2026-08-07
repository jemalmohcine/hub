"use server";

import { getHubUser } from "@/core/auth/get-user";
import { createAdminClient } from "@/core/auth/supabase/admin";
import { enrichI18nMetadata } from "@/modules/ai-intel/brief";
import {
  itemNeedsContentRefresh,
  reorganizeClassifiedItem,
} from "@/modules/ai-intel/enrich-classified";
import type { ClassifiedItem } from "@/modules/ai-intel/types";

/** Translate and refresh organized content for an existing item. */
export async function ensureItemTranslation(itemId: string) {
  const user = await getHubUser();
  if (!user) throw new Error("Unauthorized");

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ai_intel_items")
    .select("*")
    .eq("id", itemId)
    .maybeSingle();

  if (error || !data) throw new Error(error?.message ?? "Not found");

  const classified: ClassifiedItem = {
    canonicalKey: data.canonical_key as string,
    pillar: data.pillar,
    category: data.category,
    urgency: data.urgency,
    title: data.title as string,
    summary: data.summary as string,
    url: data.url as string,
    primarySource: data.primary_source as string,
    sourceRefs: Array.isArray(data.source_refs) ? data.source_refs : [],
    publishedAt: data.published_at as string | null,
    metadata: (data.metadata ?? {}) as Record<string, unknown>,
  };

  const meta = classified.metadata;
  const reorganized =
    itemNeedsContentRefresh(meta)
      ? await reorganizeClassifiedItem(classified)
      : classified;

  const nextMeta = await enrichI18nMetadata(reorganized, {
    force: itemNeedsContentRefresh(meta),
  });

  const mergedMeta = { ...reorganized.metadata, ...nextMeta };
  const takeaway =
    typeof mergedMeta.takeaway === "string"
      ? mergedMeta.takeaway
      : reorganized.summary;

  await admin
    .from("ai_intel_items")
    .update({
      title: reorganized.title,
      summary: String(takeaway).slice(0, 220),
      urgency: reorganized.urgency,
      metadata: mergedMeta,
    })
    .eq("id", itemId);

  return mergedMeta;
}
