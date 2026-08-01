import { createClient } from "@/core/auth/supabase/server";
import { normalizeCvDocument } from "@/modules/cv-builder/defaults";
import type { CvDocument } from "@/modules/cv-builder/types";

export async function getCvDocument(userId: string): Promise<CvDocument | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cv_documents")
    .select("id, title, theme_id, content")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;

  const normalized = normalizeCvDocument({
    ...(data.content as Record<string, unknown>),
    id: data.id,
    title: data.title,
    themeId: data.theme_id,
  });

  return normalized;
}
