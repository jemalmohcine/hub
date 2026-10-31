export type VeilleCategory =
  | "securite"
  | "versions"
  | "modeles-prix"
  | "outils-agents"
  | "repos-github";

export type VeilleProvider =
  | "anthropic"
  | "openai"
  | "google-gemini"
  | "xai-grok"
  | "vercel"
  | "cursor"
  | "github"
  | "nuxt-vue"
  | "laravel-php"
  | "node-npm"
  | "other";

export type VeilleSeverity = "critique" | "elevee" | "moyenne" | "info";

export type VeilleItem = {
  id: string;
  feed_date: string;
  category: VeilleCategory;
  provider: VeilleProvider;
  severity: VeilleSeverity;
  title: string;
  summary: string;
  quoi: string;
  impact: string;
  link: string;
  affected_versions: string[];
  fixed_versions: string[];
  stars_week: number | null;
  stars_month: number | null;
  price_info: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  saved?: boolean;
};

export type VeilleIngestItem = {
  date: string;
  category: VeilleCategory;
  provider: VeilleProvider;
  severity: VeilleSeverity;
  title: string;
  summary: string;
  quoi?: string;
  impact?: string;
  link: string;
  affected_versions?: string[];
  fixed_versions?: string[];
  stars_week?: number | null;
  stars_month?: number | null;
  price_info?: string | null;
  tags?: string[];
};

export const VEILLE_CATEGORIES: VeilleCategory[] = [
  "securite",
  "versions",
  "modeles-prix",
  "outils-agents",
  "repos-github",
];

export const VEILLE_PROVIDERS: VeilleProvider[] = [
  "anthropic",
  "openai",
  "google-gemini",
  "xai-grok",
  "vercel",
  "cursor",
  "github",
  "nuxt-vue",
  "laravel-php",
  "node-npm",
  "other",
];

export const VEILLE_SEVERITY_ORDER: Record<VeilleSeverity, number> = {
  critique: 0,
  elevee: 1,
  moyenne: 2,
  info: 3,
};
