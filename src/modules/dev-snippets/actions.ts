"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/core/auth/supabase/server";
import { assertEntitled } from "@/core/entitlements/assert-entitled";
import { ENTITLEMENTS } from "@/core/entitlements/keys";
import { normalizeSnippetImage } from "@/modules/dev-snippets/image";
import { rankSnippetsWithLlm } from "@/modules/dev-snippets/llm-search";
import { rankSnippets } from "@/modules/dev-snippets/match";
import {
  listDevSnippetCategories,
  listDevSnippets,
  rowToSnippet,
  SNIPPET_SELECT,
} from "@/modules/dev-snippets/queries";
import type { DevSnippetCategory, DevSnippetInput } from "@/modules/dev-snippets/types";

/** Every action in this file requires the snippets module. */
const requireUser = () => assertEntitled(ENTITLEMENTS.snippets);

function normalizeTags(tags?: string[]): string[] {
  if (!tags) return [];
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))].slice(
    0,
    12,
  );
}

function normalizeCategoryName(name: string): string {
  return name.replace(/\s+/g, " ").trim().slice(0, 40);
}

function rowFromInput(input: DevSnippetInput, userId: string) {
  return {
    user_id: userId,
    title: input.title.trim(),
    kind: input.kind,
    language: input.language?.trim() || null,
    content: input.content,
    tags: normalizeTags(input.tags),
    category_id: input.categoryId?.trim() || null,
    reference_url: input.referenceUrl?.trim() || null,
    image_url: normalizeSnippetImage(input.imageUrl),
    is_pinned: input.isPinned ?? false,
  };
}

async function categoryNamesForUser(userId: string): Promise<Map<string, string>> {
  const categories = await listDevSnippetCategories(userId);
  return new Map(categories.map((category) => [category.id, category.name]));
}

function assertOwnCategory(categoryId: string | null | undefined, names: Map<string, string>) {
  if (!categoryId) return;
  if (!names.has(categoryId)) {
    throw new Error("Cette catégorie ne t’appartient pas.");
  }
}

export async function createDevSnippet(input: DevSnippetInput) {
  const user = await requireUser();
  const supabase = await createClient();
  const names = await categoryNamesForUser(user.id);
  assertOwnCategory(input.categoryId, names);

  const { data, error } = await supabase
    .from("dev_snippets")
    .insert(rowFromInput(input, user.id))
    .select(SNIPPET_SELECT)
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/app/snippets");
  return rowToSnippet(data, names);
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
  if (input.categoryId !== undefined) {
    const names = await categoryNamesForUser(user.id);
    assertOwnCategory(input.categoryId, names);
    patch.category_id = input.categoryId?.trim() || null;
  }
  if (input.referenceUrl !== undefined) patch.reference_url = input.referenceUrl?.trim() || null;
  if (input.imageUrl !== undefined) patch.image_url = normalizeSnippetImage(input.imageUrl);
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

export async function createDevSnippetCategory(name: string): Promise<DevSnippetCategory> {
  const user = await requireUser();
  const supabase = await createClient();
  const trimmed = normalizeCategoryName(name);
  if (!trimmed) throw new Error("Donne un nom à la catégorie.");

  const { data, error } = await supabase
    .from("dev_snippet_categories")
    .insert({ user_id: user.id, name: trimmed })
    .select("id, name, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Cette catégorie existe déjà.");
    }
    throw new Error(error.message);
  }

  revalidatePath("/app/snippets");
  return {
    id: data.id as string,
    name: data.name as string,
    createdAt: data.created_at as string,
  };
}

export async function deleteDevSnippetCategory(id: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("dev_snippet_categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/app/snippets");
}

export async function searchDevSnippets(query: string): Promise<{
  ids: string[];
  source: "ai" | "local";
}> {
  const user = await requireUser();
  const q = query.trim();
  if (q.length < 2) return { ids: [], source: "local" };

  const snippets = await listDevSnippets(user.id);
  const local = rankSnippets(q, snippets);
  const localIds = local.map((item) => item.id);

  const catalog = local.length >= 3 ? local : snippets;
  const aiIds = await rankSnippetsWithLlm(q, catalog);
  if (aiIds && aiIds.length > 0) {
    const seen = new Set(aiIds);
    return {
      ids: [...aiIds, ...localIds.filter((id) => !seen.has(id))],
      source: "ai",
    };
  }

  return { ids: localIds, source: "local" };
}
