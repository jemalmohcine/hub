import { describe, expect, it } from "vitest";
import {
  maturityFrom,
  overallScore,
  popularityFromStars,
  priceRank,
  stabilityFromRepo,
  type RepoFacts,
} from "@/modules/dev-tools/scoring";

const NOW = Date.parse("2026-08-01T00:00:00Z");

function daysAgo(days: number): string {
  return new Date(NOW - days * 86_400_000).toISOString();
}

function facts(overrides: Partial<RepoFacts> = {}): RepoFacts {
  return {
    stars: 10_000,
    forks: 800,
    createdAt: daysAgo(365 * 6),
    lastCommitAt: daysAgo(3),
    lastReleaseAt: daysAgo(20),
    license: "MIT",
    isArchived: false,
    ...overrides,
  };
}

describe("popularityFromStars", () => {
  it("spreads the common range instead of bunching it at the bottom", () => {
    expect(popularityFromStars(1_000)).toBe(60);
    expect(popularityFromStars(10_000)).toBe(80);
    expect(popularityFromStars(100_000)).toBe(100);
  });

  it("returns 0 when there is no repository to measure", () => {
    expect(popularityFromStars(null)).toBe(0);
    expect(popularityFromStars(0)).toBe(0);
  });
});

describe("stabilityFromRepo", () => {
  it("gives a full score to an old, active, released, licensed project", () => {
    expect(stabilityFromRepo(facts(), NOW)).toBe(100);
  });

  it("zeroes an archived project whatever its other signals say", () => {
    expect(stabilityFromRepo(facts({ isArchived: true }), NOW)).toBe(0);
  });

  it("drops when the project stops receiving commits", () => {
    const stale = stabilityFromRepo(facts({ lastCommitAt: daysAgo(500) }), NOW);
    expect(stale).toBeLessThan(stabilityFromRepo(facts(), NOW));
  });

  it("penalises a young project with no release history", () => {
    const young = stabilityFromRepo(
      facts({ createdAt: daysAgo(120), lastReleaseAt: null, license: null }),
      NOW,
    );
    expect(young).toBeLessThan(50);
  });
});

describe("maturityFrom", () => {
  it("calls an old and solid project mature", () => {
    expect(maturityFrom(85, daysAgo(365 * 7), false, NOW)).toBe("mature");
  });

  it("does not call a solid but recent project mature", () => {
    expect(maturityFrom(85, daysAgo(365), false, NOW)).toBe("stable");
  });

  it("refuses to rate an archived project", () => {
    expect(maturityFrom(90, daysAgo(365 * 8), true, NOW)).toBe("unknown");
  });
});

describe("overallScore", () => {
  it("weighs adoption and safety equally", () => {
    expect(overallScore(80, 60)).toBe(70);
  });
});

describe("priceRank", () => {
  it("puts free options first and unknown prices last", () => {
    expect(priceRank(true, 20)).toBeLessThan(priceRank(false, 5));
    expect(priceRank(false, 5)).toBeLessThan(priceRank(false, null));
  });
});
