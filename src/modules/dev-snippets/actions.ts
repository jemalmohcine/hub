"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/core/auth/supabase/server";
import { assertEntitled } from "@/core/entitlements/assert-entitled";
import { ENTITLEMENTS } from "@/core/entitlements/keys";
import type { DevSnippetInput } from "@/modules/dev-snippets/types";

/** Every action in this file requires the snippets module. */
const requireUser = () => assertEntitled(ENTITLEMENTS.snippets);

function normalizeTags(tags?: string[]): string[] {
  if (!tags) return [];
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))].slice(
    0,
    12,
  );
}

function rowFromInput(input: DevSnippetInput, userId: string) {
  return {
    user_id: userId,
    title: input.title.trim(),
    kind: input.kind,
    language: input.language?.trim() || null,
    content: input.content,
    tags: normalizeTags(input.tags),
    reference_url: input.referenceUrl?.trim() || null,
    is_pinned: input.isPinned ?? false,
  };
}

export async function createDevSnippet(input: DevSnippetInput) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("dev_snippets")
    .insert(rowFromInput(input, user.id))
    .select(
      "id, title, kind, language, content, tags, reference_url, is_pinned, created_at, updated_at",
    )
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/app/snippets");

  return {
    id: data.id,
    title: data.title,
    kind: data.kind,
    language: data.language,
    content: data.content,
    tags: data.tags ?? [],
    referenceUrl: data.reference_url,
    isPinned: data.is_pinned,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateDevSnippet(id: string, input: Partial<DevSnippetInput>) {
  const user = await requireUser();
  const supabase = await createClient();

  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.kind !== undefined) patch.kind = input.kind;
  if (input.language !== undefined) patch.language = input.language?.trim() || null;
  if (input.content !== undefined) patch.content = input.content;
  if (input.tags !== undefined) patch.tags = normalizeTags(input.tags);
  if (input.referenceUrl !== undefined) patch.reference_url = input.referenceUrl?.trim() || null;
  if (input.isPinned !== undefined) patch.is_pinned = input.isPinned;

  const { error } = await supabase
    .from("dev_snippets")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/app/snippets");
}

export async function deleteDevSnippet(id: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("dev_snippets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/app/snippets");
}

export async function toggleDevSnippetPin(id: string, isPinned: boolean) {
  await updateDevSnippet(id, { isPinned });
}
