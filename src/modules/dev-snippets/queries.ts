import { createClient } from "@/core/auth/supabase/server";
import type { DevSnippet, DevSnippetCategory } from "@/modules/dev-snippets/types";

export const SNIPPET_SELECT =
  "id, title, kind, language, content, tags, category_id, reference_url, image_url, is_pinned, created_at, updated_at";

type SnippetRow = {
  id: string;
  title: string;
  kind: string;
  language: string | null;
  content: string;
  tags: string[] | null;
  category_id: string | null;
  reference_url: string | null;
  image_url: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
};

export function rowToSnippet(
  row: SnippetRow,
  categories: Map<string, string> = new Map(),
): DevSnippet {
  const categoryId = row.category_id ?? null;
  return {
    id: row.id,
    title: row.title,
    kind: row.kind as DevSnippet["kind"],
    language: row.language,
    content: row.content,
    tags: row.tags ?? [],
    categoryId,
    categoryName: categoryId ? (categories.get(categoryId) ?? null) : null,
    referenceUrl: row.reference_url,
    imageUrl: row.image_url ?? null,
    isPinned: row.is_pinned,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listDevSnippetCategories(
  userId: string,
): Promise<DevSnippetCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dev_snippet_categories")
    .select("id, name, created_at")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    createdAt: row.created_at as string,
  }));
}

export async function listDevSnippets(userId: string): Promise<DevSnippet[]> {
  const supabase = await createClient();
  const categories = await listDevSnippetCategories(userId);
  const names = new Map(categories.map((category) => [category.id, category.name]));

  const { data, error } = await supabase
    .from("dev_snippets")
    .select(SNIPPET_SELECT)
    .eq("user_id", userId)
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => rowToSnippet(row as SnippetRow, names));
}
