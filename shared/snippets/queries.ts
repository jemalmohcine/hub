import type { SupabaseClient } from "@supabase/supabase-js";
import type { DevSnippet, DevSnippetCategory } from "~/shared/snippets/types";

/** Same dev_snippets select + filters as overview (count/list). */
export async function fetchDevSnippetsForUser(
  client: SupabaseClient,
  userId: string,
): Promise<DevSnippet[]> {
  const { data: rows, error } = await client
    .from("dev_snippets")
    .select(
      "id, title, kind, language, content, tags, category_id, reference_url, image_url, is_pinned, created_at, updated_at",
    )
    .eq("user_id", userId)
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return (rows ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    kind: row.kind as DevSnippet["kind"],
    language: row.language as string | null,
    content: row.content as string,
    tags: (row.tags as string[]) ?? [],
    categoryId: row.category_id as string | null,
    categoryName: null as string | null,
    referenceUrl: row.reference_url as string | null,
    imageUrl: row.image_url as string | null,
    isPinned: Boolean(row.is_pinned),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));
}

export async function countDevSnippetsForUser(
  client: SupabaseClient,
  userId: string,
): Promise<number> {
  const { count, error } = await client
    .from("dev_snippets")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw error;
  return count ?? 0;
}

export async function fetchSnippetCategoriesForUser(
  client: SupabaseClient,
  userId: string,
): Promise<DevSnippetCategory[]> {
  const { data: cats, error } = await client
    .from("dev_snippet_categories")
    .select("id, name, created_at")
    .eq("user_id", userId)
    .order("name");

  if (error) return [];

  return (cats ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    createdAt: c.created_at as string,
  }));
}

/** Snippets list page payload: snippets always loaded; categories best-effort. */
export async function loadSnippetsWorkspace(
  client: SupabaseClient,
  userId: string,
): Promise<{ snippets: DevSnippet[]; categories: DevSnippetCategory[] }> {
  const [snippets, categories] = await Promise.all([
    fetchDevSnippetsForUser(client, userId),
    fetchSnippetCategoriesForUser(client, userId),
  ]);

  const names = new Map(categories.map((c) => [c.id, c.name]));
  for (const s of snippets) {
    if (s.categoryId) s.categoryName = names.get(s.categoryId) ?? null;
  }

  return { snippets, categories };
}
