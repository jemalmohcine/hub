"use server";

import { getHubUser } from "@/core/auth/get-user";
import { createAdminClient } from "@/core/auth/supabase/admin";
import { enrichI18nMetadata } from "@/modules/ai-intel/brief";
import type { ClassifiedItem } from "@/modules/ai-intel/types";

/** Translate once for an existing item (force refresh FR/EN pair). */
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

  const nextMeta = await enrichI18nMetadata(classified, { force: true });
  const takeaway =
    typeof nextMeta.takeaway === "string" ? nextMeta.takeaway : data.summary;

  await admin
    .from("ai_intel_items")
    .update({
      summary: String(takeaway).slice(0, 220),
      metadata: nextMeta,
    })
    .eq("id", itemId);

  return nextMeta;
}
