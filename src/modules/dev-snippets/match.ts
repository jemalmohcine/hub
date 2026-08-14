import { foldCase } from "@/lib/text";

export type SnippetSearchItem = {
  id: string;
  title: string;
  kind: string;
  language: string | null;
  content: string;
  tags: string[];
  categoryName?: string | null;
};

/** Short aliases a developer types instead of the full word. */
const TOKEN_ALIASES: Record<string, string[]> = {
  js: ["javascript"],
  ts: ["typescript"],
  py: ["python"],
  pg: ["postgres", "postgresql", "psql"],
  postgres: ["postgresql", "psql", "pg"],
  k8s: ["kubernetes"],
  kube: ["kubernetes"],
  docker: ["dockerfile", "compose", "container"],
  compose: ["docker", "dockerfile"],
  sh: ["bash", "shell"],
  bash: ["shell"],
};

function expandToken(token: string): string[] {
  const aliases = TOKEN_ALIASES[token] ?? [];
  return [token, ...aliases];
}

export function tokenizeQuery(query: string): string[] {
  return foldCase(query)
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function haystack(item: SnippetSearchItem) {
  return {
    title: foldCase(item.title),
    tags: foldCase(item.tags.join(" ")),
    language: foldCase(item.language ?? ""),
    category: foldCase(item.categoryName ?? ""),
    content: foldCase(item.content),
  };
}

function fieldHits(field: string, variants: string[]): boolean {
  return variants.some((variant) => field.includes(variant));
}

/** Higher is a closer match. 0 means the snippet does not match the query. */
export function scoreSnippet(query: string, item: SnippetSearchItem): number {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return 1;

  const fields = haystack(item);
  let score = 0;
  let matched = 0;

  for (const token of tokens) {
    const variants = expandToken(token);
    let tokenScore = 0;
    if (fieldHits(fields.title, variants)) tokenScore = Math.max(tokenScore, 50);
    if (fieldHits(fields.category, variants)) tokenScore = Math.max(tokenScore, 45);
    if (fieldHits(fields.tags, variants)) tokenScore = Math.max(tokenScore, 40);
    if (fieldHits(fields.language, variants)) tokenScore = Math.max(tokenScore, 35);
    if (fieldHits(fields.content, variants)) tokenScore = Math.max(tokenScore, 18);
    if (tokenScore > 0) {
      matched += 1;
      score += tokenScore;
    }
  }

  if (matched === 0) return 0;
  // Prefer snippets that cover every word of the query.
  score += matched * 8;
  if (matched === tokens.length) score += 20;
  return score;
}

export function rankSnippets<T extends SnippetSearchItem>(
  query: string,
  items: T[],
): T[] {
  if (!tokenizeQuery(query).length) return items;

  return items
    .map((item) => ({ item, score: scoreSnippet(query, item) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((row) => row.item);
}

/** Merge an AI id list with local matches: AI order first, then leftover local hits. */
export function mergeRankedIds(
  aiIds: string[] | null,
  localIds: string[],
  knownIds: Set<string>,
): string[] | null {
  if (!aiIds || aiIds.length === 0) return null;
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const id of aiIds) {
    if (!knownIds.has(id) || seen.has(id)) continue;
    seen.add(id);
    merged.push(id);
  }
  for (const id of localIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    merged.push(id);
  }
  return merged.length > 0 ? merged : null;
}
