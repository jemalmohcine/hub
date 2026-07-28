"use server";

import { revalidatePath } from "next/cache";
import { getHubUser } from "@/core/auth/get-user";
import { createClient } from "@/core/auth/supabase/server";

export async function markNotificationRead(notificationId: string) {
  const user = await getHubUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await createClient();
  const { error } = await supabase.from("hub_notification_reads").upsert(
    {
      user_id: user.id,
      notification_id: notificationId,
      read_at: new Date().toISOString(),
    },
    { onConflict: "user_id,notification_id" },
  );
  if (error) throw new Error(error.message);
  revalidatePath("/app", "layout");
}

export async function markAllNotificationsRead(notificationIds: string[]) {
  const user = await getHubUser();
  if (!user) throw new Error("Unauthorized");
  if (notificationIds.length === 0) return;

  const supabase = await createClient();
  const rows = notificationIds.map((notification_id) => ({
    user_id: user.id,
    notification_id,
    read_at: new Date().toISOString(),
  }));
  const { error } = await supabase
    .from("hub_notification_reads")
    .upsert(rows, { onConflict: "user_id,notification_id" });
  if (error) throw new Error(error.message);
  revalidatePath("/app", "layout");
}
