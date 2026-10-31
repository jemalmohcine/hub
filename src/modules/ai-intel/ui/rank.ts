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
 * Security / CVE, an LLM price change, or a widely used AI repo that explodes.
 * A changelog, an outage, or a new model is interesting, not urgent.
 */
export function isCriticalPushAlert(item: AlertItem): boolean {
  const intel = asIntelItem(item);
  const kind = detectContentKind(intel);
  const signal =
    typeof intel.metadata?.hardSignal === "string"
      ? String(intel.metadata.hardSignal)
      : "";

  if (signal === "security" || kind === "security") return true;
  if (isLlmPriceChange(intel, signal, kind)) return true;
  if (isWellUsedExplodingRepo(intel)) return true;
  return isRevolutionaryTool(intel);
}

const LLM_PRICE_RE =
  /\b(llm|gpt-?\d|claude|gemini|openai|anthropic|mistral|llama|grok|token(?:s)?|per[- ]token|copilot)\b/i;

function isLlmPriceChange(
  item: AiIntelItem,
  signal: string,
  kind: ReturnType<typeof detectContentKind>,
): boolean {
  if (signal !== "pricing" && kind !== "pricing") return false;
  if (item.pillar === "models" || kind === "model") return true;
  const text = `${item.title} ${item.summary ?? ""}`;
  return LLM_PRICE_RE.test(text);
}

/** Popular enough that an explosion actually matters to a working dev. */
const WELL_USED_STARS = 2_000;

export function isWellUsedExplodingRepo(item: AiIntelItem): boolean {
  if (itemKind(item) !== "repo") return false;
  const { stars, starsToday, rank } = readRepoMomentum(item);
  const wellUsed = stars >= WELL_USED_STARS || (rank > 0 && rank <= 3 && stars >= 1_000);
  if (!wellUsed) return false;

  const meta = (item.metadata ?? {}) as Record<string, unknown>;
  if (meta.exploding === true) return true;
  return isRepoExploding(item) || starsToday >= 400;
}

function isRevolutionaryTool(item: AiIntelItem): boolean {
  if (itemKind(item) === "repo") return false;
  if (detectContentKind(item) !== "tool") return false;

  const meta = (item.metadata ?? {}) as Record<string, unknown>;
  const score = Number(meta.score) || 0;
  if (meta.exploding === true) return true;
  if (item.urgency === "urgent" && meta.actionRequired === true) return true;
  if (item.urgency === "urgent" && score >= 80) return true;
  return false;
}

/** Same rule as push: faille / prix LLM / repo AI très utilisé qui explose. */
export function isHotAlert(item: AiIntelItem): boolean {
  return isCriticalPushAlert(item);
}

const TRENDING_SOURCES = new Set(["github-trending", "gittrend"]);

/** GitHub tab: AI repos that are already used and taking off. */
export function isTrending(item: AiIntelItem): boolean {
  if (itemKind(item) !== "repo") return false;
  const { starsToday, starsWeek, stars, rank } = readRepoMomentum(item);
  const wellUsed = stars >= 1_000;
  const hotGrowth =
    starsToday >= 200 ||
    (starsWeek >= 1_000 && starsToday >= 80) ||
    (rank > 0 && rank <= 5 && starsToday >= 150);

  if (TRENDING_SOURCES.has(item.primary_source) && (wellUsed || hotGrowth)) {
    return true;
  }
  if (wellUsed && hotGrowth) return true;
  if (wellUsed && starsToday >= 100 && starsToday >= stars * 0.12) return true;
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

/** Hot alerts, then unread, then trending, then score. */
export function sortForDeveloper(a: AiIntelItem, b: AiIntelItem): number {
  const ha = isHotAlert(a) ? 1 : 0;
  const hb = isHotAlert(b) ? 1 : 0;
  if (ha !== hb) return hb - ha;

  if (ha && hb) {
    const ra = a.read ? 1 : 0;
    const rb = b.read ? 1 : 0;
    if (ra !== rb) return ra - rb;
  }

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
