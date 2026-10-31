export const EXPENSE_CATEGORIES = [
  "ai_api",
  "hosting",
  "database",
  "auth",
  "ci_cd",
  "monitoring",
  "email",
  "storage",
  "saas",
  "other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const BILLING_CYCLES = ["monthly", "yearly", "usage"] as const;

export type BillingCycle = (typeof BILLING_CYCLES)[number];

export type DevExpenseService = {
  id: string;
  name: string;
  providerSlug: string | null;
  category: ExpenseCategory;
  billingCycle: BillingCycle;
  plannedAmountCents: number;
  currency: string;
  websiteUrl: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DevExpenseEntry = {
  id: string;
  serviceId: string;
  month: string;
  amountCents: number;
  currency: string;
  notes: string | null;
  createdAt: string;
};

export type ServiceWithStats = DevExpenseService & {
  monthAmountCents: number | null;
  ytdTotalCents: number;
  entryCount: number;
};

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  ai_api: "API / LLM",
  hosting: "Hosting / déploiement",
  database: "Base de données",
  auth: "Auth / identité",
  ci_cd: "CI / CD",
  monitoring: "Monitoring / logs",
  email: "Email / transactional",
  storage: "Stockage / fichiers",
  saas: "SaaS dev",
  other: "Autre",
};

export const BILLING_LABELS: Record<BillingCycle, string> = {
  monthly: "Mensuel",
  yearly: "Annuel",
  usage: "Usage / variable",
};

export const MIGRATION_EFFORTS = ["low", "medium", "high"] as const;

export type MigrationEffort = (typeof MIGRATION_EFFORTS)[number];

export const EFFORT_LABELS: Record<MigrationEffort, string> = {
  low: "Migration rapide",
  medium: "Migration modérée",
  high: "Migration lourde",
};

export type AlternativeOption = {
  name: string;
  slug: string;
  typicalMonthlyEur: number | null;
  /** What the free plan actually covers, or null when there is none. */
  freeTier: string | null;
  pros: string[];
  cons: string[];
  bestFor: string;
  migrationEffort: MigrationEffort;
  url: string | null;
};

/** Where a diagnostic came from — the UI says so instead of implying AI everywhere. */
export type AdviceSource = "ai" | "catalog";

export type ExpenseDiagnostic = {
  verdict: "keep" | "review" | "consider_switch";
  verdictLabel: string;
  summary: string;
  monthlySpendEur: number;
  shareOfBudgetPct: number;
  alternatives: AlternativeOption[];
  potentialSavingsEur: number | null;
  /** Concrete next steps, ordered by what pays off first. */
  actions: string[];
  /** What breaks or gets worse if the user switches. */
  risks: string[];
  source: AdviceSource;
};

/** What the AI recognised from a free-text service name. */
export type ProviderSuggestion = {
  canonicalName: string;
  providerSlug: string;
  category: ExpenseCategory;
  billingCycle: BillingCycle;
  websiteUrl: string | null;
  /** Typical price of the plan the user most likely has, in euros per month. */
  typicalMonthlyEur: number | null;
  freeTier: string | null;
  /** One line describing what the service does. */
  note: string;
  confidence: number;
  source: AdviceSource;
  /** Cheaper or free options for the same job, read from the scraped catalogue. */
  alternatives: AlternativeOption[];
};

export const BUDGET_FINDING_KINDS = [
  "duplicate",
  "overpriced",
  "free_alternative",
  "underused",
  "consolidation",
  "healthy",
] as const;

export type BudgetFindingKind = (typeof BUDGET_FINDING_KINDS)[number];

export const FINDING_LABELS: Record<BudgetFindingKind, string> = {
  duplicate: "Doublon",
  overpriced: "Trop cher",
  free_alternative: "Gratuit possible",
  underused: "Sous-utilisé",
  consolidation: "À regrouper",
  healthy: "Bien calibré",
};

export type BudgetFinding = {
  kind: BudgetFindingKind;
  title: string;
  detail: string;
  /** Service names this finding is about, so the UI can highlight them. */
  services: string[];
  monthlySavingsEur: number | null;
  effort: MigrationEffort;
  recommendation: string;
};

export type BudgetDiagnostic = {
  headline: string;
  summary: string;
  /** 0-100: how well the stack is calibrated for what it costs. */
  healthScore: number;
  monthlySavingsEur: number;
  findings: BudgetFinding[];
  quickWins: string[];
  source: AdviceSource;
  generatedAt: string;
};
