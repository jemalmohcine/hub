"use server";

import { revalidatePath } from "next/cache";
import { getHubUser } from "@/core/auth/get-user";
import { createClient } from "@/core/auth/supabase/server";
import { hasEntitlement } from "@/core/entitlements";
import type { CvDocument } from "@/modules/cv-builder/types";

function assertEntitled() {
  const user = getHubUser();
  return user.then((u) => {
    if (!u) throw new Error("Unauthorized");
    if (!hasEntitlement(u.entitlements, "module:cv")) {
      throw new Error("Pro entitlement required");
    }
    return u;
  });
}

export async function saveCvDocument(doc: CvDocument) {
  const user = await assertEntitled();
  const supabase = await createClient();

  const payload = {
    user_id: user.id,
    title: doc.title,
    theme_id: doc.themeId,
    content: {
      profile: doc.profile,
      skillGroups: doc.skillGroups,
      experiences: doc.experiences,
      projects: doc.projects,
      education: doc.education,
      certifications: doc.certifications,
      languages: doc.languages,
      openSource: doc.openSource,
    },
  };

  const { data: existing } = await supabase
    .from("cv_documents")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("cv_documents")
      .update(payload)
      .eq("user_id", user.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("cv_documents").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/app/cv");
}
