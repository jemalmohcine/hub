import type { VeilleItem } from "./types";
import { toDayKey } from "../lib/dates";

/** Normalize DB row (feed_date column or legacy metadata.feed_date). */
export function mapVeilleRow(row: Record<string, unknown>): VeilleItem {
  const meta = (row.metadata ?? {}) as Record<string, unknown>;
  let feedDate = row.feed_date as string | undefined;
  if (!feedDate && typeof meta.feed_date === "string") feedDate = meta.feed_date;
  if (!feedDate && typeof row.created_at === "string") feedDate = toDayKey(row.created_at);

  return {
    ...(row as unknown as VeilleItem),
    feed_date: feedDate ?? toDayKey(new Date()),
    tags: (row.tags as string[]) ?? [],
  };
}
