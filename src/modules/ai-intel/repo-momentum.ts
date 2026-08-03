import type { AiIntelItem } from "@/modules/ai-intel/types";

export type RepoMomentum = {
  starsToday: number;
  starsWeek: number;
  stars: number;
  rank: number;
};

export function readRepoMomentum(item: Pick<AiIntelItem, "metadata">): RepoMomentum {
  const meta = (item.metadata ?? {}) as Record<string, unknown>;
  const starsToday = Number(meta.starsToday) || 0;
  const starsWeek =
    Number(meta.starsWeek) ||
    Number(meta.starsWeekEstimate) ||
    (starsToday > 0 ? starsToday * 5 : 0);
  const stars = Number(meta.stars) || 0;
  const rank = Number(meta.rank) || 0;
  return { starsToday, starsWeek, stars, rank };
}

/** True viral repo: strong daily AND weekly star growth. */
export function isRepoExploding(item: Pick<AiIntelItem, "metadata">): boolean {
  const { starsToday, starsWeek, stars, rank } = readRepoMomentum(item);

  if (starsToday <= 0 && starsWeek <= 0) return false;

  if (starsToday >= 600) return true;
  if (starsToday >= 300 && starsWeek >= 1200) return true;
  if (starsWeek >= 2000 && starsToday >= 120) return true;

  if (rank > 0 && rank <= 3 && starsToday >= 280 && starsWeek >= 900) {
    return true;
  }

  if (stars > 0 && starsToday >= 180 && starsToday / stars >= 0.18) {
    return true;
  }

  if (starsToday >= 220 && starsWeek >= 1000) return true;

  return false;
}
