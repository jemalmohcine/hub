import { createClient } from "@/core/auth/supabase/server";
import type { DevSnippet } from "@/modules/dev-snippets/types";

type SnippetRow = {
  id: string;
  title: string;
  kind: string;
  language: string | null;
  content: string;
  tags: string[] | null;
  reference_url: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
};

function rowToSnippet(row: SnippetRow): DevSnippet {
  return {
    id: row.id,
    title: row.title,
    kind: row.kind as DevSnippet["kind"],
    language: row.language,
    content: row.content,
    tags: row.tags ?? [],
    referenceUrl: row.reference_url,
    isPinned: row.is_pinned,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listDevSnippets(userId: string): Promise<DevSnippet[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dev_snippets")
    .select(
      "id, title, kind, language, content, tags, reference_url, is_pinned, created_at, updated_at",
    )
    .eq("user_id", userId)
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => rowToSnippet(row as SnippetRow));
}
