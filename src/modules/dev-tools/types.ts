import type { ExpenseCategory } from "@/modules/dev-expenses/types";

/** Tools and expenses share one taxonomy so an alternative always maps to a line item. */
export type ToolCategory = ExpenseCategory;

export const PRICING_MODELS = [
  "open_source",
  "free",
  "freemium",
  "paid",
  "usage",
  "unknown",
] as const;

export type PricingModel = (typeof PRICING_MODELS)[number];

export const PRICING_LABELS: Record<PricingModel, string> = {
  open_source: "Open source",
  free: "Gratuit",
  freemium: "Freemium",
  paid: "Payant",
  usage: "À l’usage",
  unknown: "Tarif inconnu",
};

export const MATURITIES = ["emerging", "growing", "stable", "mature", "unknown"] as const;

export type Maturity = (typeof MATURITIES)[number];

export const MATURITY_LABELS: Record<Maturity, string> = {
  emerging: "Émergent",
  growing: "En croissance",
  stable: "Stable",
  mature: "Mature",
  unknown: "Maturité inconnue",
};

export const AUDIENCES = ["solo", "pro", "enterprise", "any"] as const;

export type Audience = (typeof AUDIENCES)[number];

export const AUDIENCE_LABELS: Record<Audience, string> = {
  solo: "Projet perso",
  pro: "Projet pro",
  enterprise: "Entreprise",
  any: "Tous usages",
};

export const DATA_SOURCES = ["seed", "github", "scrape", "llm"] as const;

export type ToolDataSource = (typeof DATA_SOURCES)[number];

export type DevTool = {
  id: string;
  slug: string;
  name: string;
  category: ToolCategory;
  tagline: string | null;
  summary: string | null;
  websiteUrl: string | null;
  pricingUrl: string | null;
  docsUrl: string | null;
  repoFullName: string | null;

  pricingModel: PricingModel;
  hasFreeTier: boolean;
  freeTierNote: string | null;
  startingPriceEur: number | null;

  license: string | null;
  stars: number | null;
  forks: number | null;
  openIssues: number | null;
  repoCreatedAt: string | null;
  lastCommitAt: string | null;
  lastReleaseAt: string | null;
  lastReleaseTag: string | null;
  isArchived: boolean;

  /** 0-100, how widely adopted the tool is. */
  popularityScore: number;
  /** 0-100, how safe it is to build on: age, release cadence, licence, activity. */
  stabilityScore: number;
  /** 0-100, the two above blended — the default ranking. */
  overallScore: number;

  maturity: Maturity;
  audience: Audience;
  bestFor: string | null;
  pros: string[];
  cons: string[];
  tags: string[];
  alternativeSlugs: string[];

  dataSource: ToolDataSource;
  discoveredVia: string | null;
  scrapedAt: string | null;
  updatedAt: string;
};

export const TOOL_SORTS = ["overall", "popularity", "stability", "price", "fresh"] as const;

export type ToolSort = (typeof TOOL_SORTS)[number];

export const SORT_LABELS: Record<ToolSort, string> = {
  overall: "Recommandés",
  popularity: "Les plus connus",
  stability: "Les plus stables",
  price: "Les moins chers",
  fresh: "Mis à jour récemment",
};

export const PRICE_FILTERS = ["all", "free", "freemium", "open_source", "paid"] as const;

export type PriceFilter = (typeof PRICE_FILTERS)[number];

export const PRICE_FILTER_LABELS: Record<PriceFilter, string> = {
  all: "Tous",
  free: "Gratuit",
  freemium: "Freemium",
  open_source: "Open source",
  paid: "Payant",
};
