import { createAdminClient } from "@/core/auth/supabase/admin";
import type {
  NotificationCategory,
  NotificationSeverity,
} from "@/modules/notifications/types";

export async function createNotification(input: {
  userId?: string | null;
  category: NotificationCategory;
  title: string;
  body?: string;
  href?: string | null;
  severity?: NotificationSeverity;
  dedupeKey?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  const userId = input.userId ?? null;
  const dedupeKey = input.dedupeKey ?? null;

  if (dedupeKey) {
    let existingQuery = admin
      .from("hub_notifications")
      .select("id")
      .eq("dedupe_key", dedupeKey)
      .limit(1);
    existingQuery = userId
      ? existingQuery.eq("user_id", userId)
      : existingQuery.is("user_id", null);
    const { data: existing } = await existingQuery.maybeSingle();
    if (existing) return existing.id as string;
  }

  const { data, error } = await admin
    .from("hub_notifications")
    .insert({
      user_id: userId,
      category: input.category,
      title: input.title,
      body: input.body ?? "",
      href: input.href ?? null,
      severity: input.severity ?? "info",
      dedupe_key: dedupeKey,
      metadata: input.metadata ?? {},
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return null;
    throw new Error(error.message);
  }
  return data.id as string;
}
