/**
 * Deterministic safety net around the LLM decision.
 *
 * These patterns only fire on wording that implies a real change, never on the
 * bare topic word, so "our pricing page" stays quiet while "we are raising
 * prices" does not. Whatever the LLM answers, a match here forces the item to
 * stay urgent — missing a CVE or a deprecation costs more than one extra alert.
 */
export type HardSignal = "security" | "pricing" | "breaking" | "outage";

const SECURITY_RE =
  /\b(cve-\d{4}-\d{3,}|zero[- ]?day|remote code execution|\brce\b|security (advisory|vulnerability|flaw|patch|fix|incident)|vulnerabilit(y|ies)|actively exploited|supply[- ]chain attack|malicious (package|npm|extension)|data (breach|leak)|credentials? (leak|exposed)|faille de s[ée]curit[ée])\b/i;

const PRICING_RE =
  /\b(price (increase|hike|change|cut|drop)|pricing (change|update|increase|revamp)|raising (our )?prices?|increase[sd]? (the )?price|now costs?|will cost|cost increase|new pricing|per[- ]token (price|cost) (increase|change)|free tier (is )?(removed|removing|ending|reduced|shrink)|no longer free|rate limits? (reduced|lowered|cut|tightened)|quota (reduced|lowered)|hausse (des|de) (prix|tarifs?))\b/i;

const BREAKING_RE =
  /\b(deprecat(e|ed|es|ing|ion)|sunset(ting|s)?|end[- ]of[- ]life|\beol\b|breaking change|migration required|must migrate|will be (removed|retired|discontinued|shut down)|shutting down|is being discontinued|retirement date|no longer (available|supported)|removes? support for|api (v\d+ )?removal|d[ée]pr[ée]ci|arr[êe]t du service)\b/i;

const OUTAGE_RE =
  /\b(major outage|service disruption|widespread (outage|failure)|degraded (performance|service)|incident (report|postmortem)|post[- ]mortem)\b/i;

export function detectHardSignal(text: string): HardSignal | null {
  if (!text) return null;
  if (SECURITY_RE.test(text)) return "security";
  if (BREAKING_RE.test(text)) return "breaking";
  if (PRICING_RE.test(text)) return "pricing";
  if (OUTAGE_RE.test(text)) return "outage";
  return null;
}

/** Minimum score an item with this signal is allowed to keep. */
export function hardSignalScoreFloor(signal: HardSignal | null): number {
  if (!signal) return 0;
  if (signal === "security") return 88;
  if (signal === "breaking") return 82;
  if (signal === "pricing") return 80;
  return 72;
}

export function hardSignalLabel(
  signal: HardSignal,
  locale: "fr" | "en",
): string {
  const labels: Record<HardSignal, { fr: string; en: string }> = {
    security: { fr: "Sécurité", en: "Security" },
    pricing: { fr: "Prix", en: "Pricing" },
    breaking: { fr: "Changement majeur", en: "Major change" },
    outage: { fr: "Panne", en: "Outage" },
  };
  return labels[signal][locale];
}
