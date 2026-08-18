import { truncateAtWord } from "@/lib/text";
import { pushAlertTitle } from "@/modules/ai-intel/essential-recap";
import { aiIntelItemHref } from "@/modules/ai-intel/item-link";
import type { PushPayload } from "@/modules/notifications/push";

export type DigestAlertItem = {
  dbId: string;
  title: string;
  summary: string;
  urgency: string;
  category: string;
  pillar: string;
  metadata: Record<string, unknown>;
  primary_source?: string;
  primarySource?: string;
};

const URGENT_TAG = "ai:urgent";
const URGENT_FEED = "/app/ai";

/**
 * One phone ping per ingest, even if several alerts landed.
 * Two urgents on screen must not become eight banners on the lock screen.
 */
export function buildCriticalPushPayload(
  items: DigestAlertItem[],
): PushPayload | null {
  if (items.length === 0) return null;

  if (items.length === 1) {
    const item = items[0]!;
    return {
      title: pushAlertTitle(item, "fr"),
      body: truncateAtWord(item.summary, 180),
      href: aiIntelItemHref(item.dbId),
      tag: URGENT_TAG,
      severity: "urgent",
    };
  }

  const headlines = items
    .slice(0, 2)
    .map((item) => pushAlertTitle(item, "fr"))
    .filter(Boolean);

  return {
    title: `${items.length} alertes urgentes`,
    body: truncateAtWord(headlines.join(" · "), 180),
    href: URGENT_FEED,
    tag: URGENT_TAG,
    severity: "urgent",
  };
}
