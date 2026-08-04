export type ExpenseCategory =
  | "ai_api"
  | "hosting"
  | "database"
  | "auth"
  | "ci_cd"
  | "monitoring"
  | "email"
  | "storage"
  | "saas"
  | "other";

export type BillingCycle = "monthly" | "yearly" | "usage";

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

export type AlternativeOption = {
  name: string;
  slug: string;
  typicalMonthlyEur: number | null;
  pros: string[];
  cons: string[];
  bestFor: string;
};

export type ExpenseDiagnostic = {
  verdict: "keep" | "review" | "consider_switch";
  verdictLabel: string;
  summary: string;
  monthlySpendEur: number;
  shareOfBudgetPct: number;
  alternatives: AlternativeOption[];
  potentialSavingsEur: number | null;
};
