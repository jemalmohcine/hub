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

/** Action required now: pricing, breaking, deprecation — never a trending repo. */
export function isHotAlert(item: AiIntelItem): boolean {
  if (itemVerdict(item) === "skip") return false;

  const kind = itemKind(item);
  // GitHub repos are trending / useful, not urgent action items.
  if (kind === "repo") return false;

  const category = String(item.category || "");
  const score = itemScore(item);
  const verdict = itemVerdict(item);
  const text = `${item.title} ${item.summary}`.toLowerCase();

  if (
    category === "pricing" ||
    category === "deprecation" ||
    category === "ban"
  ) {
    return true;
  }

  // Radical change that forces a concrete action (migrate, update keys, pay more…)
  const actionRequired =
    /\b(deprecat|sunset|retir|breaking|migration required|api change|price|pricing|rate\s*limit|removed|shutdown|cve|vulnerab|security patch|outage)\b/i.test(
      text,
    );

  if (actionRequired && verdict !== "skip") return true;

  if (category === "upgrade" && item.urgency === "urgent" && score >= 70) {
    return true;
  }

  return (
    item.urgency === "urgent" &&
    (category === "capacity" || score >= 75)
  );
}

export function isTrending(item: AiIntelItem): boolean {
  if (itemKind(item) !== "repo" && item.category !== "trending_repo") {
    const meta = (item.metadata ?? {}) as Record<string, unknown>;
    const starsToday = Number(meta.starsToday) || 0;
    return starsToday >= 80;
  }

  const meta = (item.metadata ?? {}) as Record<string, unknown>;
  const starsToday = Number(meta.starsToday) || 0;
  const stars = Number(meta.stars) || 0;
  const rank = Number(meta.rank) || 0;
  return (
    item.category === "trending_repo" ||
    starsToday >= 50 ||
    (rank > 0 && rank <= 25) ||
    (stars >= 2000 && starsToday >= 20)
  );
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

/** Unread first, then hot alerts, then trending repos, then score. */
export function sortForDeveloper(a: AiIntelItem, b: AiIntelItem): number {
  const ra = a.read ? 1 : 0;
  const rb = b.read ? 1 : 0;
  if (ra !== rb) return ra - rb;

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
    new Date(b.ingested_at).getTime() - new Date(a.ingested_at).getTime() ||
    new Date(b.published_at || 0).getTime() -
      new Date(a.published_at || 0).getTime()
  );
}
