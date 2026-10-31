/**
 * Maximum lengths enforced before writing to the database or calling the LLM.
 * These used to be magic numbers scattered across collectors and actions.
 */
export const FIELD_LIMITS = {
  /** Titles: DB column cap shared by intel items and job offers. */
  title: 240,
  /** Long-form body kept for scraping/LLM context. */
  body: 4000,
  /** Generated summaries shown in the UI. */
  summary: 700,
  /** Short labels: company, source, tag. */
  name: 80,
  /** One-line clause used on cards. */
  clause: 160,
} as const;

export type FieldLimit = keyof typeof FIELD_LIMITS;

/** Hard cut at `max` characters, appending an ellipsis when truncation happened. */
export function truncateWithEllipsis(text: string, max: number): string {
  const value = text.trim();
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(1, max - 1)).trim()}…`;
}

/** Clamp to a named field limit without an ellipsis — for values headed to the DB. */
export function clampField(text: string | null | undefined, field: FieldLimit): string {
  if (!text) return "";
  return text.trim().slice(0, FIELD_LIMITS[field]);
}

/** Collapse whitespace and non-breaking spaces into single spaces. */
export function collapseWhitespace(text: string): string {
  return text.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

/** Replace em/en dashes so UI copy never shows the AI-style " — ". */
export function plainDash(text: string): string {
  return collapseWhitespace(text.replace(/\s*[—–]\s*/g, " : "));
}

/**
 * Cut at `max` characters but never mid-word, appending an ellipsis.
 * Prefer this over `truncateWithEllipsis` for anything a human reads.
 */
export function truncateAtWord(text: string, max: number): string {
  const value = collapseWhitespace(text);
  if (value.length <= max) return value;

  const slice = value.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${cut.replace(/[\s,;:.\-–—]+$/, "")}…`;
}

/**
 * Comparison key ignoring case, accents, and punctuation — two strings that
 * only differ by formatting produce the same key.
 */
function comparisonKey(text: string): string {
  return foldCase(text).replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * True when `candidate` says nothing new next to `existing`: identical,
 * contained in it, or sharing a long opening. Used to stop the same sentence
 * from appearing as the title, the summary, and the first bullet.
 */
export function isNearDuplicate(
  candidate: string,
  existing: string,
  minPrefix = 40,
): boolean {
  const a = comparisonKey(candidate);
  const b = comparisonKey(existing);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length >= 12 && b.includes(a)) return true;
  if (b.length >= 12 && a.includes(b)) return true;

  const shared = Math.min(a.length, b.length, minPrefix);
  return shared >= minPrefix && a.slice(0, shared) === b.slice(0, shared);
}

/** Keep the first occurrence of each distinct idea, in order. */
export function dedupeTexts(values: string[], minPrefix = 40): string[] {
  const kept: string[] = [];
  for (const value of values) {
    const text = value.trim();
    if (!text) continue;
    if (kept.some((seen) => isNearDuplicate(text, seen, minPrefix))) continue;
    kept.push(text);
  }
  return kept;
}

/** Case- and accent-insensitive comparison key. */
export function foldCase(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
