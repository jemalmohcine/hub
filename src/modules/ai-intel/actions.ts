"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/core/auth/supabase/server";
import { assertEntitled } from "@/core/entitlements/assert-entitled";
import { ENTITLEMENTS } from "@/core/entitlements/keys";

/** Every action in this file requires the AI module. */
const requireUser = () => assertEntitled(ENTITLEMENTS.ai);

export async function toggleAiIntelSave(itemId: string): Promise<{ saved: boolean }> {
  const user = await requireUser();

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
  await setAiIntelTreated(itemId, true);
}

export async function setAiIntelTreated(
  itemId: string,
  treated: boolean,
): Promise<{ treated: boolean }> {
  const user = await requireUser();
  const supabase = await createClient();

  if (treated) {
    const { error } = await supabase.from("ai_intel_reads").upsert(
      {
        user_id: user.id,
        item_id: itemId,
        read_at: new Date().toISOString(),
      },
      { onConflict: "user_id,item_id" },
    );
    if (error && !/ai_intel_reads|schema cache|does not exist/i.test(error.message)) {
      throw new Error(error.message);
    }
  } else {
    const { error } = await supabase
      .from("ai_intel_reads")
      .delete()
      .eq("user_id", user.id)
      .eq("item_id", itemId);
    if (error && !/ai_intel_reads|schema cache|does not exist/i.test(error.message)) {
      throw new Error(error.message);
    }
  }

  revalidatePath("/app/ai");
  revalidatePath("/app/overview");
  return { treated };
}
