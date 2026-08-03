"use server";

import { revalidatePath } from "next/cache";
import { getHubUser } from "@/core/auth/get-user";
import { createClient } from "@/core/auth/supabase/server";
import { hasEntitlement } from "@/core/entitlements";

export async function toggleAiIntelSave(itemId: string): Promise<{ saved: boolean }> {
  const user = await getHubUser();
  if (!user) throw new Error("Non connecté");
  if (!hasEntitlement(user.entitlements, "module:ai")) {
    throw new Error("Abonnement Pro requis");
  }

  const supabase = await createClient();
  const { data: existing, error: readError } = await supabase
    .from("ai_intel_saves")
    .select("item_id")
    .eq("user_id", user.id)
    .eq("item_id", itemId)
    .maybeSingle();

  if (readError) throw new Error(readError.message);

  if (existing) {
    const { error } = await supabase
      .from("ai_intel_saves")
      .delete()
      .eq("user_id", user.id)
      .eq("item_id", itemId);
    if (error) throw new Error(error.message);
    revalidatePath("/app/ai");
    return { saved: false };
  }

  const { error } = await supabase.from("ai_intel_saves").insert({
    user_id: user.id,
    item_id: itemId,
  });
  if (error) {
    if (/foreign key|violates foreign key/i.test(error.message)) {
      throw new Error("Cet élément n’est plus disponible");
    }
    throw new Error(error.message);
  }

  revalidatePath("/app/ai");
  return { saved: true };
}

export async function markAiIntelRead(itemId: string) {
  const user = await getHubUser();
  if (!user) throw new Error("Unauthorized");
  if (!hasEntitlement(user.entitlements, "module:ai")) {
    throw new Error("Pro entitlement required");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("ai_intel_reads").upsert(
    {
      user_id: user.id,
      item_id: itemId,
      read_at: new Date().toISOString(),
    },
    { onConflict: "user_id,item_id" },
  );

  // Table may not exist yet before migration 006
  if (error && !/ai_intel_reads|schema cache|does not exist/i.test(error.message)) {
    throw new Error(error.message);
  }

  revalidatePath("/app/ai");
}
