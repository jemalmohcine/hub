import type { Maturity } from "@/modules/dev-tools/types";

/**
 * Turns raw repository facts into the two numbers the catalogue ranks on.
 * Pure and deterministic: the same repo scores the same every night, so a
 * ranking change always means something actually moved.
 */

export type RepoFacts = {
  stars: number | null;
  forks: number | null;
  createdAt: string | null;
  lastCommitAt: string | null;
  lastReleaseAt: string | null;
  license: string | null;
  isArchived: boolean;
};

const DAY_MS = 86_400_000;

function daysSince(iso: string | null, now: number): number | null {
  if (!iso) return null;
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return null;
  return Math.max(0, (now - time) / DAY_MS);
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Stars on a log scale: 100 → 40, 1k → 60, 10k → 80, 100k → 100. Linear
 * scaling would put everything below 5k stars in the same bucket.
 */
export function popularityFromStars(stars: number | null): number {
  if (!stars || stars <= 0) return 0;
  return clampScore(20 * Math.log10(stars + 1));
}

/** Age, release cadence, licence and activity — what makes a tool safe to build on. */
export function stabilityFromRepo(facts: RepoFacts, now = Date.now()): number {
  if (facts.isArchived) return 0;

  const ageDays = daysSince(facts.createdAt, now);
  const ageYears = ageDays == null ? 0 : ageDays / 365;
  const age = (Math.min(ageYears, 5) / 5) * 30;

  const sincePush = daysSince(facts.lastCommitAt, now);
  const activity =
    sincePush == null ? 0 : sincePush <= 30 ? 25 : sincePush <= 90 ? 18 : sincePush <= 180 ? 10 : sincePush <= 365 ? 4 : 0;

  const sinceRelease = daysSince(facts.lastReleaseAt, now);
  const releases =
    sinceRelease == null ? 0 : sinceRelease <= 180 ? 20 : sinceRelease <= 365 ? 12 : 6;

  const licensed = facts.license ? 10 : 0;

  return clampScore(age + activity + releases + licensed + 15);
}

export function maturityFrom(
  stability: number,
  createdAt: string | null,
  isArchived: boolean,
  now = Date.now(),
): Maturity {
  if (isArchived) return "unknown";

  const ageDays = daysSince(createdAt, now);
  const ageYears = ageDays == null ? 0 : ageDays / 365;

  if (ageYears >= 5 && stability >= 70) return "mature";
  if (stability >= 60) return "stable";
  if (stability >= 40) return "growing";
  return "emerging";
}

/** The default ranking: being widely used and being safe count the same. */
export function overallScore(popularity: number, stability: number): number {
  return clampScore(0.5 * popularity + 0.5 * stability);
}

/**
 * Sort key for "les moins chers": anything free comes first, then ascending
 * price, then tools whose price we could not read.
 */
export function priceRank(
  hasFreeTier: boolean,
  startingPriceEur: number | null,
): number {
  if (hasFreeTier) return -1;
  if (startingPriceEur == null) return Number.MAX_SAFE_INTEGER;
  return startingPriceEur;
}
