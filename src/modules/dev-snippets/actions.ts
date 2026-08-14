"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/core/auth/supabase/server";
import { assertEntitled } from "@/core/entitlements/assert-entitled";
import { ENTITLEMENTS } from "@/core/entitlements/keys";
import {
  matchExistingCategory,
  normalizeCategoryName,
  type CategoryHint,
} from "@/modules/dev-snippets/classify-category";
import { normalizeSnippetImage } from "@/modules/dev-snippets/image";
import { resolveSnippetCategory } from "@/modules/dev-snippets/llm-category";
import { rankSnippetsWithLlm } from "@/modules/dev-snippets/llm-search";
import { rankSnippets } from "@/modules/dev-snippets/match";
import {
  listDevSnippetCategories,
  listDevSnippets,
  rowToSnippet,
  SNIPPET_SELECT,
} from "@/modules/dev-snippets/queries";
import type { DevSnippet, DevSnippetCategory, DevSnippetInput } from "@/modules/dev-snippets/types";

/** Every action in this file requires the snippets module. */
const requireUser = () => assertEntitled(ENTITLEMENTS.snippets);

function normalizeTags(tags?: string[]): string[] {
  if (!tags) return [];
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))].slice(
    0,
    12,
  );
}

function rowFromInput(
  input: DevSnippetInput,
  userId: string,
  categoryId: string | null,
) {
  return {
    user_id: userId,
    title: input.title.trim(),
    kind: input.kind,
    language: input.language?.trim() || null,
    content: input.content,
    tags: normalizeTags(input.tags),
    category_id: categoryId,
    reference_url: input.referenceUrl?.trim() || null,
    image_url: normalizeSnippetImage(input.imageUrl),
    is_pinned: input.isPinned ?? false,
  };
}

function hintFromInput(input: Partial<DevSnippetInput>): CategoryHint {
  return {
    title: input.title ?? "",
    content: input.content ?? "",
    language: input.language ?? null,
    tags: normalizeTags(input.tags),
  };
}

async function categoryNamesForUser(userId: string): Promise<Map<string, string>> {
  const categories = await listDevSnippetCategories(userId);
  return new Map(categories.map((category) => [category.id, category.name]));
}

async function ensureCategory(
  userId: string,
  name: string,
): Promise<DevSnippetCategory> {
  const supabase = await createClient();
  const trimmed = normalizeCategoryName(name);
  if (!trimmed) throw new Error("Impossible de nommer la catégorie.");
  const existing = await listDevSnippetCategories(userId);
  const matched = matchExistingCategory(
    trimmed,
    existing.map((category) => category.name),
  );
  const hit = matched
    ? existing.find((category) => category.name === matched)
    : undefined;
  if (hit) return hit;

  const { data, error } = await supabase
    .from("dev_snippet_categories")
    .insert({ user_id: userId, name: trimmed })
    .select("id, name, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      const again = await listDevSnippetCategories(userId);
      const racedName = matchExistingCategory(
        trimmed,
        again.map((category) => category.name),
      );
      const raced = racedName
        ? again.find((category) => category.name === racedName)
        : undefined;
      if (raced) return raced;
    }
    throw new Error(error.message);
  }

  return {
    id: data.id as string,
    name: data.name as string,
    createdAt: data.created_at as string,
  };
}

function revalidateSnippetsLater() {
  after(() => {
    revalidatePath("/app/snippets");
  });
}

async function assignCategory(
  userId: string,
  hint: CategoryHint,
  names: Map<string, string>,
): Promise<{ categoryId: string; names: Map<string, string> }> {
  const chosen = await resolveSnippetCategory(hint, [...names.values()]);
  const category = await ensureCategory(userId, chosen);
  const next = new Map(names);
  next.set(category.id, category.name);
  return { categoryId: category.id, names: next };
}

export async function createDevSnippet(input: DevSnippetInput) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("dev_snippets")
    .insert(rowFromInput(input, user.id, null))
    .select(SNIPPET_SELECT)
    .single();

  if (error) throw new Error(error.message);
  revalidateSnippetsLater();
  return rowToSnippet(data);
}

export async function updateDevSnippet(
  id: string,
  input: Partial<DevSnippetInput>,
): Promise<DevSnippet> {
  const user = await requireUser();
  const supabase = await createClient();
  const names = await categoryNamesForUser(user.id);

  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.kind !== undefined) patch.kind = input.kind;
  if (input.language !== undefined) patch.language = input.language?.trim() || null;
  if (input.content !== undefined) patch.content = input.content;
  if (input.tags !== undefined) patch.tags = normalizeTags(input.tags);
  if (input.referenceUrl !== undefined) patch.reference_url = input.referenceUrl?.trim() || null;
  if (input.imageUrl !== undefined) patch.image_url = normalizeSnippetImage(input.imageUrl);
  if (input.isPinned !== undefined) patch.is_pinned = input.isPinned;

  const { data, error } = await supabase
    .from("dev_snippets")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select(SNIPPET_SELECT)
    .single();

  if (error) throw new Error(error.message);
  revalidateSnippetsLater();
  return rowToSnippet(data, names);
}

/** LLM (or local fallback) names the snippet, then creates/reuses a category. */
export async function assignDevSnippetCategory(id: string): Promise<DevSnippet> {
  const user = await requireUser();
  const supabase = await createClient();
  const names = await categoryNamesForUser(user.id);

  const { data: current, error: currentError } = await supabase
    .from("dev_snippets")
    .select("title, content, language, tags")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (currentError) throw new Error(currentError.message);

  const assigned = await assignCategory(
    user.id,
    hintFromInput({
      title: current.title as string,
      content: current.content as string,
      language: current.language as string | null,
      tags: (current.tags as string[] | null) ?? [],
    }),
    names,
  );

  const { data, error } = await supabase
    .from("dev_snippets")
    .update({ category_id: assigned.categoryId })
    .eq("id", id)
    .eq("user_id", user.id)
    .select(SNIPPET_SELECT)
    .single();

  if (error) throw new Error(error.message);
  revalidateSnippetsLater();
  return rowToSnippet(data, assigned.names);
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
