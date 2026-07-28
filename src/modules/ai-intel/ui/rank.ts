import type { AiIntelItem, AiUrgency } from "@/modules/ai-intel/types";

export function itemVerdict(item: AiIntelItem): string {
  return String(item.metadata?.verdict ?? "");
}

export function itemScore(item: AiIntelItem): number {
  return Number(item.metadata?.score) || 0;
}

export function isBeneficial(item: AiIntelItem): boolean {
  return (
    item.metadata?.beneficial === true || itemVerdict(item) === "use_it"
  );
}

export function isNoise(item: AiIntelItem): boolean {
  return itemVerdict(item) === "skip" || (itemScore(item) > 0 && itemScore(item) < 42);
}

const URGENCY_RANK: Record<AiUrgency, number> = {
  urgent: 0,
  medium: 1,
  light: 2,
};

/** Sort: impact first, then beneficial repos/tools, then score. */
export function sortForDeveloper(a: AiIntelItem, b: AiIntelItem): number {
  const ua = URGENCY_RANK[a.urgency] ?? 2;
  const ub = URGENCY_RANK[b.urgency] ?? 2;
  if (ua !== ub) return ua - ub;

  const ba = isBeneficial(a) ? 1 : 0;
  const bb = isBeneficial(b) ? 1 : 0;
  if (ba !== bb) return bb - ba;

  const sa = itemScore(a);
  const sb = itemScore(b);
  if (sa !== sb) return sb - sa;

  return (
    new Date(b.ingested_at).getTime() - new Date(a.ingested_at).getTime()
  );
}
