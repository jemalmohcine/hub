import type { VeilleItem } from "./types";

/** Hide dev-only seed rows if they still exist in the database. */
export function isClientVeilleItem(item: Pick<VeilleItem, "tags" | "title">): boolean {
  if ((item.tags ?? []).includes("exemple-dev")) return false;
  const title = (item.title ?? "").trim();
  if (/^\[exemple dev\]/i.test(title)) return false;
  return true;
}

export function filterClientVeilleItems<T extends Pick<VeilleItem, "tags" | "title">>(
  items: T[],
): T[] {
  return items.filter(isClientVeilleItem);
}
