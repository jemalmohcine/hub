import { foldCase } from "@/lib/text";

/** URL- and filename-safe slug. Falls back to `fallback` when nothing survives. */
export function slugify(value: string, fallback = "item"): string {
  const slug = foldCase(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

/** Comparison key for dedupe: accents, punctuation, and spacing removed. */
export function normalizeForDedupe(value: string): string {
  return foldCase(value).replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}
