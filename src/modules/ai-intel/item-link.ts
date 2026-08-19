export function aiIntelItemHref(itemId: string): string {
  return `/app/ai?item=${encodeURIComponent(itemId)}`;
}

export function aiIntelItemHrefByKey(canonicalKey: string): string {
  return `/app/ai?key=${encodeURIComponent(canonicalKey)}`;
}

const FEED_TABS = ["all", "urgent", "github", "tools", "news", "saved"] as const;
const FEED_PERIODS = ["today", "7d", "month", "year"] as const;

export type AiFeedTab = (typeof FEED_TABS)[number];
export type AiFeedPeriod = (typeof FEED_PERIODS)[number];

export function parseAiFeedTab(raw: string | null | undefined): AiFeedTab {
  return FEED_TABS.includes(raw as AiFeedTab) ? (raw as AiFeedTab) : "all";
}

export function parseAiFeedPeriod(raw: string | null | undefined): AiFeedPeriod {
  return FEED_PERIODS.includes(raw as AiFeedPeriod) ? (raw as AiFeedPeriod) : "today";
}

/** Home « À traiter »: unread urgents for the year, not just today. */
export function aiIntelInboxHref(): string {
  return "/app/ai?tab=urgent&period=year";
}

export function resolveAiIntelDeepLink(metadata: Record<string, unknown> | null | undefined): string | null {
  if (!metadata) return null;
  const itemId = metadata.itemId;
  if (typeof itemId === "string" && itemId) return aiIntelItemHref(itemId);
  const key = metadata.canonicalKey;
  if (typeof key === "string" && key) return aiIntelItemHrefByKey(key);
  return null;
}
