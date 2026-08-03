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

export function isBeneficial(item: AiIntelItem): boolean {
  return item.metadata?.beneficial === true || itemVerdict(item) === "use_it";
}

export function isNoise(item: AiIntelItem): boolean {
  return (
    itemVerdict(item) === "skip" ||
    (itemScore(item) > 0 && itemScore(item) < 42)
  );
}

/** Action required now: pricing, breaking, security, exploding repos. */
export function isHotAlert(item: AiIntelItem): boolean {
  if (itemVerdict(item) === "skip") return false;

  const kind = detectContentKind(item);
  const meta = (item.metadata ?? {}) as Record<string, unknown>;
  const starsToday = Number(meta.starsToday) || 0;

  if (kind === "repo") {
    return isRepoExploding(item);
  }

  if (kind === "pricing" || kind === "breaking" || kind === "security") {
    return true;
  }

  const category = String(item.category || "");
  const score = itemScore(item);

  if (kind === "model") {
    return (
      category === "new_model" ||
      category === "upgrade" ||
      category === "capacity" ||
      item.urgency === "urgent"
    );
  }

  if (category === "upgrade" && item.urgency === "urgent" && score >= 70) {
    return true;
  }

  return (
    item.urgency === "urgent" &&
    (category === "capacity" || score >= 75)
  );
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
 * Phone + bell alerts only for high-signal events:
 * exploding repos, pricing, new models, breaking/security.
 */
export function isCriticalPushAlert(item: AlertItem): boolean {
  const intel = asIntelItem(item);
  const meta = (item.metadata ?? {}) as Record<string, unknown>;
  const kind = detectContentKind(intel);
  const category = String(item.category || "");
  const starsToday = Number(meta.starsToday) || 0;

  if (kind === "repo") {
    return isRepoExploding(intel);
  }

  if (kind === "pricing" || kind === "breaking" || kind === "security") {
    return true;
  }

  if (kind === "model") {
    return (
      category === "new_model" ||
      category === "upgrade" ||
      category === "capacity" ||
      item.urgency === "urgent"
    );
  }

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
