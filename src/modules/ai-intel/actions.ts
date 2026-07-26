"use server";

import { revalidatePath } from "next/cache";
import { getHubUser } from "@/core/auth/get-user";
import { createClient } from "@/core/auth/supabase/server";
import { hasEntitlement } from "@/core/entitlements";

export async function toggleAiIntelSave(itemId: string) {
  const user = await getHubUser();
  if (!user) throw new Error("Unauthorized");
  if (!hasEntitlement(user.entitlements, "module:ai")) {
    throw new Error("Pro entitlement required");
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("ai_intel_saves")
    .select("item_id")
    .eq("user_id", user.id)
    .eq("item_id", itemId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("ai_intel_saves")
      .delete()
      .eq("user_id", user.id)
      .eq("item_id", itemId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("ai_intel_saves").insert({
      user_id: user.id,
      item_id: itemId,
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/app/ai");
}
