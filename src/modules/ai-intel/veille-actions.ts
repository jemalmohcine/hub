"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/core/auth/supabase/server";
import { assertEntitled } from "@/core/entitlements/assert-entitled";
import { ENTITLEMENTS } from "@/core/entitlements/keys";

const requireUser = () => assertEntitled(ENTITLEMENTS.ai);

export async function toggleVeilleSave(itemId: string): Promise<{ saved: boolean }> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: existing, error: readError } = await supabase
    .from("veille_ia_saves")
    .select("item_id")
    .eq("user_id", user.id)
    .eq("item_id", itemId)
    .maybeSingle();

  if (readError) throw new Error(readError.message);

  if (existing) {
    const { error } = await supabase
      .from("veille_ia_saves")
      .delete()
      .eq("user_id", user.id)
      .eq("item_id", itemId);
    if (error) throw new Error(error.message);
    revalidatePath("/app/ai");
    return { saved: false };
  }

  const { error } = await supabase.from("veille_ia_saves").insert({
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
