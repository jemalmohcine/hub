import {
  VEILLE_SEVERITY_ORDER,
  type VeilleItem,
} from "@/modules/ai-intel/veille/types";

/** Critical security and high-impact items first, then title for stability. */
export function sortVeilleItems(items: VeilleItem[]): VeilleItem[] {
  return [...items].sort((a, b) => {
    const sa = VEILLE_SEVERITY_ORDER[a.severity];
    const sb = VEILLE_SEVERITY_ORDER[b.severity];
    if (sa !== sb) return sa - sb;
    if (a.category === "securite" && b.category !== "securite") return -1;
    if (b.category === "securite" && a.category !== "securite") return 1;
    return a.title.localeCompare(b.title, "fr");
  });
}
