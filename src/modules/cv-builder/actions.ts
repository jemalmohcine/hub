"use server";

import { revalidatePath } from "next/cache";
import { getHubUser } from "@/core/auth/get-user";
import { createClient } from "@/core/auth/supabase/server";
import { hasEntitlement } from "@/core/entitlements";
import { defaultCvDocument } from "@/modules/cv-builder/defaults";
import { getCvDocumentById } from "@/modules/cv-builder/queries";
import { tailorCvForJob } from "@/modules/cv-builder/tailor";
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

function docToPayload(doc: CvDocument, userId: string) {
  return {
    user_id: userId,
    title: doc.title,
    theme_id: doc.themeId,
    target_job_title: doc.targetJobTitle ?? null,
    job_description_snippet: doc.jobDescriptionSnippet ?? null,
    is_tailored: doc.isTailored ?? false,
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
}

export async function loadCvDocument(documentId: string): Promise<CvDocument> {
  const user = await assertEntitled();
  const doc = await getCvDocumentById(user.id, documentId);
  if (!doc) throw new Error("CV introuvable");
  return doc;
}

export async function saveCvDocument(doc: CvDocument): Promise<CvDocument> {
  const user = await assertEntitled();
  const supabase = await createClient();
  const payload = docToPayload(doc, user.id);

  if (doc.id) {
    const { data, error } = await supabase
      .from("cv_documents")
      .update(payload)
      .eq("id", doc.id)
      .eq("user_id", user.id)
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    revalidatePath("/app/cv");
    return { ...doc, id: data.id };
  }

  const { data, error } = await supabase
    .from("cv_documents")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/app/cv");
  return { ...doc, id: data.id };
}

export async function createCvDocument(title?: string): Promise<CvDocument> {
  await assertEntitled();
  const doc = defaultCvDocument();
  if (title) doc.title = title;
  return saveCvDocument(doc);
}

export async function deleteCvDocument(documentId: string): Promise<void> {
  const user = await assertEntitled();
  const supabase = await createClient();

  const { error } = await supabase
    .from("cv_documents")
    .delete()
    .eq("id", documentId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/app/cv");
  revalidatePath("/app/jobs");
}

export async function duplicateCvDocument(documentId: string): Promise<CvDocument> {
  const user = await assertEntitled();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cv_documents")
    .select("title, theme_id, content, target_job_title, job_description_snippet, is_tailored")
    .eq("id", documentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) throw new Error("CV introuvable");

  const copyTitle = `${data.title} (copie)`;
  const { data: inserted, error: insertError } = await supabase
    .from("cv_documents")
    .insert({
      user_id: user.id,
      title: copyTitle,
      theme_id: data.theme_id,
      target_job_title: data.target_job_title,
      job_description_snippet: data.job_description_snippet,
      is_tailored: data.is_tailored,
      content: data.content,
    })
    .select("id")
    .single();

  if (insertError) throw new Error(insertError.message);
  revalidatePath("/app/cv");

  return {
    ...(data.content as Omit<CvDocument, "id" | "title" | "themeId">),
    id: inserted.id,
    title: copyTitle,
    themeId: data.theme_id as CvDocument["themeId"],
    targetJobTitle: data.target_job_title ?? undefined,
    jobDescriptionSnippet: data.job_description_snippet ?? undefined,
    isTailored: data.is_tailored ?? false,
  };
}

export async function tailorCvFromJobDescription(
  sourceDocumentId: string,
  jobDescription: string,
): Promise<CvDocument> {
  const user = await assertEntitled();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cv_documents")
    .select("title, theme_id, content, target_job_title, job_description_snippet, is_tailored")
    .eq("id", sourceDocumentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) throw new Error("CV source introuvable");

  const source: CvDocument = {
    ...(data.content as Omit<CvDocument, "id" | "title" | "themeId">),
    id: sourceDocumentId,
    title: data.title,
    themeId: data.theme_id as CvDocument["themeId"],
    targetJobTitle: data.target_job_title ?? undefined,
    jobDescriptionSnippet: data.job_description_snippet ?? undefined,
    isTailored: data.is_tailored ?? false,
  };

  const tailored = tailorCvForJob(source, jobDescription);
  return saveCvDocument(tailored);
}
