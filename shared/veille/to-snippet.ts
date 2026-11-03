import type { SupabaseClient } from "@supabase/supabase-js";
import { VEILLE_CATEGORY_LABELS, VEILLE_PROVIDER_LABELS } from "~/shared/veille/labels";
import type { VeilleItem } from "~/shared/veille/types";

export function normalizeSnippetReferenceUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    url.hash = "";
    let href = url.href;
    if (href.endsWith("/") && url.pathname !== "/") {
      href = href.slice(0, -1);
    }
    return href;
  } catch {
    return trimmed;
  }
}

export async function fetchSnippetReferenceLinksForUser(
  client: SupabaseClient,
  userId: string,
): Promise<Set<string>> {
  const { data, error } = await client
    .from("dev_snippets")
    .select("reference_url")
    .eq("user_id", userId)
    .not("reference_url", "is", null);

  if (error) throw error;

  const links = new Set<string>();
  for (const row of data ?? []) {
    const url = row.reference_url as string | null;
    if (!url) continue;
    const normalized = normalizeSnippetReferenceUrl(url);
    if (normalized) links.add(normalized);
  }
  return links;
}

export function buildVeilleSnippetTags(item: VeilleItem): string[] {
  const categoryTag = VEILLE_CATEGORY_LABELS[item.category] ?? item.category;
  const providerTag = VEILLE_PROVIDER_LABELS[item.provider] ?? item.provider;
  return ["veille", categoryTag, providerTag];
}

function formatImpactBlock(impact: string): string {
  const lines = impact
    .split("\n")
    .map((line) => line.replace(/^•\s*/, "").trim())
    .filter(Boolean);
  if (lines.length === 0) return "";
  return `Impact\n${lines.map((line) => `- ${line}`).join("\n")}`;
}

/** Body stored in dev_snippets.content (link + résumé + impact). */
export function buildVeilleSnippetContent(item: VeilleItem): string {
  const parts: string[] = [item.link.trim(), "", item.summary.trim()];
  const impactBlock = item.impact ? formatImpactBlock(item.impact) : "";
  if (impactBlock) {
    parts.push("", impactBlock);
  }
  return parts.join("\n").trim();
}

export type VeilleSnippetInsertRow = {
  user_id: string;
  title: string;
  kind: "note";
  language: null;
  content: string;
  tags: string[];
  reference_url: string;
  is_pinned: false;
};

export function buildVeilleSnippetInsertRow(userId: string, item: VeilleItem): VeilleSnippetInsertRow {
  return {
    user_id: userId,
    title: item.title.trim(),
    kind: "note",
    language: null,
    content: buildVeilleSnippetContent(item),
    tags: buildVeilleSnippetTags(item),
    reference_url: item.link.trim(),
    is_pinned: false,
  };
}

export async function saveVeilleItemAsSnippet(
  client: SupabaseClient,
  userId: string,
  item: VeilleItem,
  knownLinks?: Set<string>,
): Promise<{ status: "created" | "duplicate" }> {
  const normalized = normalizeSnippetReferenceUrl(item.link);
  if (!normalized) {
    throw new Error("Lien manquant pour cette actualité.");
  }

  const links = knownLinks ?? (await fetchSnippetReferenceLinksForUser(client, userId));
  if (links.has(normalized)) {
    return { status: "duplicate" };
  }

  const row = buildVeilleSnippetInsertRow(userId, item);
  const { error } = await client.from("dev_snippets").insert(row);
  if (error) throw error;

  links.add(normalized);
  return { status: "created" };
}
