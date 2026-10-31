"use server";

import { revalidatePath } from "next/cache";
import { getHubUser } from "@/core/auth/get-user";
import { createClient } from "@/core/auth/supabase/server";

export async function savePushSubscription(input: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
}) {
  const user = await getHubUser();
  if (!user) throw new Error("Unauthorized");
  if (!input.endpoint || !input.keys?.p256dh || !input.keys?.auth) {
    throw new Error("Invalid subscription");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("hub_push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      user_agent: input.userAgent?.slice(0, 300) ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  );

  if (
    error &&
    !/hub_push_subscriptions|schema cache|does not exist/i.test(error.message)
  ) {
    throw new Error(error.message);
  }

  revalidatePath("/app/settings/appearance");
  return { ok: true };
}

export async function removePushSubscription(endpoint: string) {
  const user = await getHubUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = await createClient();
  const { error } = await supabase
    .from("hub_push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  if (
    error &&
    !/hub_push_subscriptions|schema cache|does not exist/i.test(error.message)
  ) {
    throw new Error(error.message);
  }

  return { ok: true };
}
