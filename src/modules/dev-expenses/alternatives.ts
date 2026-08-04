import type {
  AlternativeOption,
  DevExpenseService,
  ExpenseCategory,
  ExpenseDiagnostic,
} from "@/modules/dev-expenses/types";

type CatalogEntry = {
  slug: string;
  alternatives: AlternativeOption[];
};

const CATALOG: Record<string, CatalogEntry> = {
  vercel: {
    slug: "vercel",
    alternatives: [
      {
        name: "Cloudflare Pages + Workers",
        slug: "cloudflare",
        typicalMonthlyEur: 0,
        pros: ["CDN global inclus", "Bon free tier", "Edge faible latence"],
        cons: ["Écosystème Next.js moins intégré que Vercel", "Courbe d’apprentissage Workers"],
        bestFor: "Sites statiques, APIs edge, budget serré",
      },
      {
        name: "Netlify",
        slug: "netlify",
        typicalMonthlyEur: 0,
        pros: ["Déploiement simple", "Forms et previews", "Free tier correct"],
        cons: ["Limites build minutes", "Moins orienté gros monolithes"],
        bestFor: "Landing pages, JAMstack, petits SaaS",
      },
      {
        name: "Railway / Fly.io",
        slug: "railway",
        typicalMonthlyEur: 5,
        pros: ["Conteneurs + DB faciles", "Prix prévisible au début"],
        cons: ["Scaling peut coûter vite", "Moins PaaS « zero config »"],
        bestFor: "Backends Node, workers, side projects",
      },
    ],
  },
  openai: {
    slug: "openai",
    alternatives: [
      {
        name: "Google Gemini API",
        slug: "google_gemini",
        typicalMonthlyEur: null,
        pros: ["Contexte long", "Tarifs compétitifs sur certains modèles"],
        cons: ["Qualité variable par tâche", "Moins d’outils agents que l’écosystème OpenAI"],
        bestFor: "Résumés, classification, gros contexte",
      },
      {
        name: "Anthropic Claude API",
        slug: "anthropic",
        typicalMonthlyEur: null,
        pros: ["Excellent pour code et long contexte", "Réponses structurées"],
        cons: ["Prix premium sur gros volumes", "Moins de modèles open-weight"],
        bestFor: "Code review, analyse docs, agents",
      },
      {
        name: "Ollama / modèles locaux",
        slug: "ollama",
        typicalMonthlyEur: 0,
        pros: ["Pas de coût API", "Données on-prem"],
        cons: ["GPU / machine requise", "Qualité < cloud sur tâches complexes"],
        bestFor: "Prototypage, données sensibles, faible volume",
      },
    ],
  },
  supabase: {
    slug: "supabase",
    alternatives: [
      {
        name: "Neon Postgres + auth maison",
        slug: "neon",
        typicalMonthlyEur: 0,
        pros: ["Postgres serverless", "Branches DB", "Free tier"],
        cons: ["Pas d’auth/storage intégrés", "Plus de pièces à assembler"],
        bestFor: "Apps Postgres-first, contrôle fin",
      },
      {
        name: "Firebase",
        slug: "firebase",
        typicalMonthlyEur: 0,
        pros: ["Auth + realtime + hosting", "Mobile-friendly"],
        cons: ["NoSQL / Firestore ≠ Postgres", "Vendor lock-in Google"],
        bestFor: "Apps mobile, realtime simple",
      },
      {
        name: "Self-hosted Postgres (Docker)",
        slug: "postgres",
        typicalMonthlyEur: 5,
        pros: ["Contrôle total", "Coût fixe sur VPS"],
        cons: ["Ops backups/sécurité", "Pas de dashboard clé en main"],
        bestFor: "Équipes avec ops, gros volumes",
      },
    ],
  },
  auth0: {
    slug: "auth0",
    alternatives: [
      {
        name: "Clerk",
        slug: "clerk",
        typicalMonthlyEur: 0,
        pros: ["UI auth prête", "Bon DX Next.js", "Free tier"],
        cons: ["Prix monte avec MAU", "Moins enterprise qu’Auth0"],
        bestFor: "SaaS B2C, onboarding rapide",
      },
      {
        name: "Supabase Auth",
        slug: "supabase_auth",
        typicalMonthlyEur: 0,
        pros: ["Inclus si tu utilises Supabase", "RLS natif"],
        cons: ["Moins de SSO enterprise", "UI à construire"],
        bestFor: "Stack Supabase, apps indie",
      },
      {
        name: "Keycloak (self-hosted)",
        slug: "keycloak",
        typicalMonthlyEur: 5,
        pros: ["Open source", "SSO / SAML complet"],
        cons: ["Maintenance lourde", "UX moins polish"],
        bestFor: "Enterprise, contrôle IAM",
      },
    ],
  },
  github: {
    slug: "github",
    alternatives: [
      {
        name: "GitLab",
        slug: "gitlab",
        typicalMonthlyEur: 0,
        pros: ["CI intégré", "Self-host possible"],
        cons: ["UX différente", "Moins d’intégrations tierces"],
        bestFor: "CI/CD tout-en-un, DevOps",
      },
      {
        name: "Codeberg / Gitea",
        slug: "gitea",
        typicalMonthlyEur: 0,
        pros: ["Gratuit / open source", "Léger"],
        cons: ["Pas d’Actions marketplace", "Écosystème plus petit"],
        bestFor: "Open source, petits repos",
      },
    ],
  },
  datadog: {
    slug: "datadog",
    alternatives: [
      {
        name: "Grafana Cloud",
        slug: "grafana",
        typicalMonthlyEur: 0,
        pros: ["Dashboards puissants", "Free tier logs/metrics"],
        cons: ["Setup plus technique", "Alerting à configurer"],
        bestFor: "Observabilité custom, SRE",
      },
      {
        name: "Better Stack",
        slug: "better_stack",
        typicalMonthlyEur: 10,
        pros: ["Uptime + logs unifiés", "Prix startup-friendly"],
        cons: ["Moins enterprise que Datadog", "Intégrations limitées"],
        bestFor: "Startups, uptime + logs basiques",
      },
    ],
  },
};

const CATEGORY_FALLBACKS: Record<ExpenseCategory, AlternativeOption[]> = {
  ai_api: CATALOG.openai.alternatives,
  hosting: CATALOG.vercel.alternatives,
  database: CATALOG.supabase.alternatives,
  auth: CATALOG.auth0.alternatives,
  ci_cd: CATALOG.github.alternatives,
  monitoring: CATALOG.datadog.alternatives,
  email: [
    {
      name: "Resend",
      slug: "resend",
      typicalMonthlyEur: 0,
      pros: ["DX excellente", "Free tier"],
      cons: ["Moins enterprise que SendGrid"],
      bestFor: "Emails transactionnels SaaS",
    },
    {
      name: "Amazon SES",
      slug: "ses",
      typicalMonthlyEur: 1,
      pros: ["Très cheap à l’échelle", "Fiable"],
      cons: ["Setup AWS", "Templates basiques"],
      bestFor: "Gros volume, coût minimal",
    },
  ],
  storage: [
    {
      name: "Cloudflare R2",
      slug: "cloudflare_r2",
      typicalMonthlyEur: 0,
      pros: ["Pas de egress fees", "S3-compatible"],
      cons: ["Écosystème moins mature que S3"],
      bestFor: "Assets, backups, médias",
    },
  ],
  saas: [],
  other: [],
};

function centsToEur(cents: number): number {
  return Math.round(cents) / 100;
}

export function monthlyEquivalentCents(service: DevExpenseService): number {
  if (service.billingCycle === "yearly") {
    return Math.round(service.plannedAmountCents / 12);
  }
  return service.plannedAmountCents;
}

export function diagnoseService(
  service: DevExpenseService,
  actualMonthlyCents: number,
  totalMonthlyCents: number,
): ExpenseDiagnostic {
  const monthlySpendEur = centsToEur(actualMonthlyCents || monthlyEquivalentCents(service));
  const shareOfBudgetPct =
    totalMonthlyCents > 0
      ? Math.round((actualMonthlyCents || monthlyEquivalentCents(service)) / totalMonthlyCents * 100)
      : 0;

  const slug = service.providerSlug?.toLowerCase() || "";
  const catalog = CATALOG[slug];
  const alternatives =
    catalog?.alternatives.length
      ? catalog.alternatives
      : CATEGORY_FALLBACKS[service.category] ?? [];

  let cheapest: number | null = null;
  for (const alt of alternatives) {
    if (alt.typicalMonthlyEur != null) {
      cheapest = cheapest == null ? alt.typicalMonthlyEur : Math.min(cheapest, alt.typicalMonthlyEur);
    }
  }

  const potentialSavingsEur =
    cheapest != null && monthlySpendEur > cheapest
      ? Math.round(monthlySpendEur - cheapest)
      : null;

  let verdict: ExpenseDiagnostic["verdict"] = "keep";
  let verdictLabel = "OK pour ton usage";
  let summary = "Coût raisonnable pour cette catégorie. Pas d’urgence à changer.";

  if (monthlySpendEur >= 80 && potentialSavingsEur != null && potentialSavingsEur >= 30) {
    verdict = "consider_switch";
    verdictLabel = "Alternative moins chère possible";
    summary = `Tu pourrais économiser ~${potentialSavingsEur} €/mois en comparant les options ci-dessous. Vale le diagnostic avant migration.`;
  } else if (monthlySpendEur >= 40 || shareOfBudgetPct >= 35) {
    verdict = "review";
    verdictLabel = "À revoir";
    summary =
      "Poste significatif dans ton budget dev. Compare les alternatives et ton usage réel avant le prochain renouvellement.";
  } else if (potentialSavingsEur != null && potentialSavingsEur >= 15) {
    verdict = "review";
    verdictLabel = "Optimisation possible";
    summary = `Des options moins chères existent (est. −${potentialSavingsEur} €/mois). Vérifie si elles couvrent tes besoins.`;
  }

  return {
    verdict,
    verdictLabel,
    summary,
    monthlySpendEur,
    shareOfBudgetPct,
    alternatives: alternatives.slice(0, 3),
    potentialSavingsEur,
  };
}

export const KNOWN_PROVIDERS = Object.keys(CATALOG).map((slug) => ({
  slug,
  label: slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
}));
