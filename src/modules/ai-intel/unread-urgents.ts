import { toDayKey } from "@/lib/dates";
import { itemFeedDay } from "@/modules/ai-intel/item-timestamps";
import { isHotAlert } from "@/modules/ai-intel/ui/rank";
import type { AiIntelItem } from "@/modules/ai-intel/types";

/** Same window as the home « À traiter » link (`period=year`). */
export function currentYearRange(now = new Date()): { from: string; to: string } {
  return {
    from: `${now.getFullYear()}-01-01`,
    to: toDayKey(now),
  };
}

/** Unread act-now alerts whose card date falls in `[from, to]`. */
export function unreadUrgentsInRange(
  items: AiIntelItem[],
  fromIsoDay: string,
  toIsoDay: string,
): AiIntelItem[] {
  return items.filter((item) => {
    if (item.read) return false;
    if (!isHotAlert(item)) return false;
    const day = itemFeedDay(item);
    if (!day) return false;
    return day >= fromIsoDay && day <= toIsoDay;
  });
}
