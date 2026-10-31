import { createClient } from "@/core/auth/supabase/server";
import { normalizeCvDocument } from "@/modules/cv-builder/defaults";
import type { CvDocument, CvDocumentSummary } from "@/modules/cv-builder/types";

type CvRow = {
  id: string;
  title: string;
  theme_id: string;
  content: unknown;
  target_job_title: string | null;
  job_description_snippet: string | null;
  is_tailored: boolean;
  updated_at: string;
};

function rowToDocument(data: CvRow): CvDocument {
  return normalizeCvDocument({
    ...(data.content as Record<string, unknown>),
    id: data.id,
    title: data.title,
    themeId: data.theme_id,
    targetJobTitle: data.target_job_title ?? undefined,
    jobDescriptionSnippet: data.job_description_snippet ?? undefined,
    isTailored: data.is_tailored,
  });
}

export async function listCvDocuments(userId: string): Promise<CvDocumentSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cv_documents")
    .select("id, title, theme_id, is_tailored, target_job_title, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    themeId: row.theme_id as CvDocumentSummary["themeId"],
    isTailored: row.is_tailored ?? false,
    targetJobTitle: row.target_job_title,
    updatedAt: row.updated_at,
  }));
}

export async function listCvDocumentsFull(userId: string): Promise<CvDocument[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cv_documents")
    .select(
      "id, title, theme_id, content, target_job_title, job_description_snippet, is_tailored, updated_at",
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => rowToDocument(row as CvRow));
}

export async function getCvDocumentById(
  userId: string,
  documentId: string,
): Promise<CvDocument | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cv_documents")
    .select(
      "id, title, theme_id, content, target_job_title, job_description_snippet, is_tailored",
    )
    .eq("user_id", userId)
    .eq("id", documentId)
    .maybeSingle();

  if (error || !data) return null;
  return rowToDocument(data as CvRow);
}

/** @deprecated Use listCvDocuments + getCvDocumentById */
export async function getCvDocument(userId: string): Promise<CvDocument | null> {
  const summaries = await listCvDocuments(userId);
  if (summaries.length === 0) return null;
  return getCvDocumentById(userId, summaries[0].id);
}
