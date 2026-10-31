import { createClient } from "@/core/auth/supabase/server";
import type {
  HubNotification,
  NotificationCategory,
} from "@/modules/notifications/types";

export async function getHubNotifications(
  userId: string,
  limit = 40,
): Promise<HubNotification[]> {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("hub_notifications")
    .select("*")
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  const list = rows ?? [];
  if (list.length === 0) return [];

  const { data: reads } = await supabase
    .from("hub_notification_reads")
    .select("notification_id")
    .eq("user_id", userId);

  const readIds = new Set((reads ?? []).map((r) => r.notification_id as string));

  return list.map((row) => ({
    id: row.id as string,
    user_id: (row.user_id as string | null) ?? null,
    category: row.category as NotificationCategory,
    title: row.title as string,
    body: (row.body as string) ?? "",
    href: (row.href as string | null) ?? null,
    severity: row.severity as HubNotification["severity"],
    dedupe_key: (row.dedupe_key as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    created_at: row.created_at as string,
    read: readIds.has(row.id as string),
  }));
}
