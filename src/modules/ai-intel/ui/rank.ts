import { detectContentKind } from "@/modules/ai-intel/content-kind";
import { isRepoExploding, readRepoMomentum } from "@/modules/ai-intel/repo-momentum";
import type { AiIntelItem, AiUrgency } from "@/modules/ai-intel/types";

export function itemVerdict(item: AiIntelItem): string {
  return String(item.metadata?.verdict ?? "");
}

export function itemScore(item: AiIntelItem): number {
  return Number(item.metadata?.score) || 0;
}

export function itemKind(item: AiIntelItem): "repo" | "tool" | "news" {
  const meta = (item.metadata ?? {}) as Record<string, unknown>;
  if (item.pillar === "opensource" || meta.kind === "repo") return "repo";
  if (item.pillar === "tools" || meta.kind === "tool") return "tool";
  return "news";
}

/** Technical labels produced by the analysis pass (empty for legacy rows). */
export function itemTags(item: AiIntelItem): string[] {
  const raw = (item.metadata ?? {}).tags;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((tag) => String(tag).trim())
    .filter((tag) => tag.length >= 2)
    .slice(0, 4);
}

export function isBeneficial(item: AiIntelItem): boolean {
  return item.metadata?.beneficial === true || itemVerdict(item) === "use_it";
}

export function isNoise(item: AiIntelItem): boolean {
  return (
    itemVerdict(item) === "skip" ||
    (itemScore(item) > 0 && itemScore(item) < 46)
  );
}

type AlertItem = Pick<
  AiIntelItem,
  "title" | "summary" | "urgency" | "category" | "pillar" | "metadata"
> & { primary_source?: string; primarySource?: string };

function asIntelItem(item: AlertItem): AiIntelItem {
  return {
    ...(item as AiIntelItem),
    primary_source: item.primary_source ?? item.primarySource ?? "",
  };
}

/**
 * Phone alerts and the Urgent tab share this rule: only act-now signals.
 * A new model, a changelog, or a merely trending repo is interesting, not urgent.
 */
export function isCriticalPushAlert(item: AlertItem): boolean {
  const meta = (item.metadata ?? {}) as Record<string, unknown>;

  if (meta.hardSignal) return true;
  if (meta.exploding === true) return true;
  if (meta.actionRequired === true && item.urgency === "urgent") return true;

  // Analysed items have already been judged above; only legacy rows fall through.
  if (meta.contentKind) return false;

  const intel = asIntelItem(item);
  const kind = detectContentKind(intel);

  if (kind === "repo") return isRepoExploding(intel);
  return kind === "pricing" || kind === "breaking" || kind === "security";
}

/** Same rule as push: CVE / prix / breaking / panne / repo qui explose. */
export function isHotAlert(item: AiIntelItem): boolean {
  return isCriticalPushAlert(item);
}

/** Trending = accelerating repo with measurable daily growth. */
export function isTrending(item: AiIntelItem): boolean {
  if (itemKind(item) !== "repo") return false;
  const { starsToday, starsWeek, stars, rank } = readRepoMomentum(item);

  if (starsToday >= 200) return true;
  if (starsWeek >= 1000 && starsToday >= 80) return true;
  if (rank > 0 && rank <= 5 && starsToday >= 150) return true;
  if (stars > 0 && starsToday >= 100 && starsToday >= stars * 0.12) return true;
  return false;
}

export type PricingKind = "free" | "freemium" | "paid" | null;

export function pricingKind(item: AiIntelItem): PricingKind {
  const kind = itemKind(item);
  if (kind === "repo") return "free";

  const raw = String(
    (item.metadata as Record<string, unknown> | undefined)?.pricing ?? "",
  ).toLowerCase();
  if (!raw) return null;
  if (/freemium/.test(raw)) return "freemium";
  if (/free|open\s*source|oss/.test(raw)) return "free";
  if (/paid|subscription|enterprise|pro\b|\$|€/.test(raw)) return "paid";
  return null;
}

const URGENCY_RANK: Record<AiUrgency, number> = {
  urgent: 0,
  medium: 1,
  light: 2,
};

/** Hot alerts, then trending, then score — read state does not reorder. */
export function sortForDeveloper(a: AiIntelItem, b: AiIntelItem): number {
  const ha = isHotAlert(a) ? 1 : 0;
  const hb = isHotAlert(b) ? 1 : 0;
  if (ha !== hb) return hb - ha;

  const ta = isTrending(a) ? 1 : 0;
  const tb = isTrending(b) ? 1 : 0;
  if (ta !== tb) return tb - ta;

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
    new Date(b.published_at || 0).getTime() -
    new Date(a.published_at || 0).getTime()
  );
}
