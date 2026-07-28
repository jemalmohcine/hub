import type { BadgeTone } from "@/design-system/components/feedback";

export function verdictTone(verdict: unknown): BadgeTone {
  if (verdict === "use_it") return "success";
  if (verdict === "watch") return "warning";
  if (verdict === "skip") return "neutral";
  return "info";
}

export function readMetaString(
  meta: Record<string, unknown>,
  key: string,
): string | null {
  const value = meta[key];
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return null;
}
