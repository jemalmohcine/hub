export function aiIntelItemHref(itemId: string): string {
  return `/app/ai?item=${encodeURIComponent(itemId)}`;
}

export function aiIntelItemHrefByKey(canonicalKey: string): string {
  return `/app/ai?key=${encodeURIComponent(canonicalKey)}`;
}

export function resolveAiIntelDeepLink(metadata: Record<string, unknown> | null | undefined): string | null {
  if (!metadata) return null;
  const itemId = metadata.itemId;
  if (typeof itemId === "string" && itemId) return aiIntelItemHref(itemId);
  const key = metadata.canonicalKey;
  if (typeof key === "string" && key) return aiIntelItemHrefByKey(key);
  return null;
}
