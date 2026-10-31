import type { AiIntelItem } from "@/modules/ai-intel/types";

export type RepoMomentum = {
  starsToday: number;
  starsWeek: number;
  stars: number;
  rank: number;
};

export function readRepoMomentum(item: Pick<AiIntelItem, "metadata">): RepoMomentum {
  const meta = (item.metadata ?? {}) as Record<string, unknown>;
  return {
    starsToday: Number(meta.starsToday) || 0,
    // Only real weekly data — never derived from starsToday, otherwise every
    // "daily AND weekly" rule below would collapse into a single variable.
    starsWeek: Number(meta.starsWeek) || Number(meta.starsWeekEstimate) || 0,
    stars: Number(meta.stars) || 0,
    rank: Number(meta.rank) || 0,
  };
}

/** Repo growing fast enough right now to be worth interrupting the user. */
export function isRepoExploding(item: Pick<AiIntelItem, "metadata">): boolean {
  const { starsToday, starsWeek, stars, rank } = readRepoMomentum(item);
  if (starsToday <= 0 && starsWeek <= 0) return false;

  if (starsToday >= 400) return true;
  if (starsToday >= 200 && rank > 0 && rank <= 5) return true;
  if (starsWeek >= 1500 && starsToday >= 120) return true;

  // Young repo taking off: a tenth of its total stars gained today.
  if (stars > 0 && starsToday >= 120 && starsToday / stars >= 0.1) return true;

  return false;
}
