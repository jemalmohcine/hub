import { foldCase } from "@/lib/text";
import type {
  AlternativeOption,
  ExpenseCategory,
  MigrationEffort,
  ProviderSuggestion,
} from "@/modules/dev-expenses/types";

/**
 * Offline knowledge about the usual dev stack. The LLM advisor is the primary
 * source of truth; this catalog is what answers when no API key is configured,
 * and what keeps provider detection instant while the model thinks.
 */

type OptionSeed = {
  name: string;
  typicalMonthlyEur: number | null;
  freeTier: string | null;
  pros: string[];
  cons: string[];
  bestFor: string;
  migrationEffort: MigrationEffort;
  url: string;
};

const OPTIONS: Record<string, OptionSeed> = {
  cloudflare: {
    name: "Cloudflare Pages + Workers",
    typicalMonthlyEur: 0,
    freeTier: "Builds et requêtes illimités en usage raisonnable, 100k req/jour sur Workers",
    pros: ["CDN global inclus", "Free tier très large", "Edge à faible latence"],
    cons: ["Intégration Next.js moins directe", "Runtime Workers à apprendre"],
    bestFor: "Sites statiques, APIs edge, budget serré",
    migrationEffort: "medium",
    url: "https://pages.cloudflare.com",
  },
  netlify: {
    name: "Netlify",
    typicalMonthlyEur: 0,
    freeTier: "100 Go de bande passante et 300 minutes de build par mois",
    pros: ["Déploiement simple", "Previews et forms inclus"],
    cons: ["Minutes de build vite consommées", "Moins adapté aux gros monolithes"],
    bestFor: "Landing pages, JAMstack, petits SaaS",
    migrationEffort: "low",
    url: "https://netlify.com",
  },
  railway: {
    name: "Railway",
    typicalMonthlyEur: 5,
    freeTier: "Crédit d'essai puis 5 $/mois d'usage inclus",
    pros: ["Conteneurs et base de données en quelques clics", "Prix prévisible au départ"],
    cons: ["Le scaling coûte vite", "Moins « zéro config » qu'un PaaS"],
    bestFor: "Backends Node, workers, side projects",
    migrationEffort: "medium",
    url: "https://railway.app",
  },
  fly: {
    name: "Fly.io",
    typicalMonthlyEur: 5,
    freeTier: "Petites machines partagées quasi gratuites",
    pros: ["Déploiement multi-région", "Facturation à la seconde"],
    cons: ["Ops à la charge du dev", "Debug réseau parfois pénible"],
    bestFor: "Apps conteneurisées proches des utilisateurs",
    migrationEffort: "medium",
    url: "https://fly.io",
  },
  google_gemini: {
    name: "Google Gemini API",
    typicalMonthlyEur: 0,
    freeTier: "Palier gratuit réel sur les modèles Flash (quotas par minute)",
    pros: ["Gratuit jusqu'à un vrai volume", "Contexte très long", "Tarifs bas au-delà"],
    cons: ["Quotas par minute sur le free tier", "Qualité variable selon la tâche"],
    bestFor: "Résumés, classification, extraction, gros contexte",
    migrationEffort: "low",
    url: "https://ai.google.dev",
  },
  groq: {
    name: "Groq (Llama, Mixtral)",
    typicalMonthlyEur: 0,
    freeTier: "Palier gratuit généreux avec limites par minute",
    pros: ["Latence très faible", "Modèles ouverts", "Coût par token minime"],
    cons: ["Pas de modèle frontier", "Moins d'outils agents"],
    bestFor: "Chat rapide, classification, volume élevé",
    migrationEffort: "low",
    url: "https://groq.com",
  },
  deepseek: {
    name: "DeepSeek API",
    typicalMonthlyEur: 2,
    freeTier: null,
    pros: ["Prix par token parmi les plus bas", "Bon en code et raisonnement"],
    cons: ["Hébergement hors UE", "Disponibilité variable"],
    bestFor: "Gros volumes de génération de code à coût minimal",
    migrationEffort: "low",
    url: "https://platform.deepseek.com",
  },
  anthropic: {
    name: "Anthropic Claude API",
    typicalMonthlyEur: null,
    freeTier: null,
    pros: ["Excellent en code et long contexte", "Sorties structurées fiables"],
    cons: ["Prix premium sur gros volumes", "Pas de palier gratuit"],
    bestFor: "Revue de code, analyse de documents, agents",
    migrationEffort: "low",
    url: "https://anthropic.com",
  },
  ollama: {
    name: "Ollama (modèles locaux)",
    typicalMonthlyEur: 0,
    freeTier: "Gratuit, limité par ta machine",
    pros: ["Aucun coût d'API", "Données qui ne sortent pas"],
    cons: ["Machine ou GPU nécessaire", "Qualité en retrait sur les tâches complexes"],
    bestFor: "Prototypage, données sensibles, faible volume",
    migrationEffort: "medium",
    url: "https://ollama.com",
  },
  neon: {
    name: "Neon Postgres",
    typicalMonthlyEur: 0,
    freeTier: "0,5 Go de stockage et branches de base incluses",
    pros: ["Postgres serverless", "Branches de base par PR", "Scale-to-zero"],
    cons: ["Ni auth ni storage intégrés", "Cold start sur le free tier"],
    bestFor: "Apps Postgres-first qui veulent garder le contrôle",
    migrationEffort: "medium",
    url: "https://neon.tech",
  },
  turso: {
    name: "Turso (SQLite edge)",
    typicalMonthlyEur: 0,
    freeTier: "500 bases et 9 Go de lecture par mois",
    pros: ["Très bon marché", "Réplication edge"],
    cons: ["SQLite, pas Postgres", "Écosystème plus jeune"],
    bestFor: "Lectures massives, données peu relationnelles",
    migrationEffort: "high",
    url: "https://turso.tech",
  },
  postgres_vps: {
    name: "Postgres auto-hébergé (VPS)",
    typicalMonthlyEur: 5,
    freeTier: null,
    pros: ["Coût fixe et prévisible", "Contrôle total"],
    cons: ["Backups et sécurité à ta charge", "Pas de dashboard clé en main"],
    bestFor: "Équipes à l'aise avec l'ops, gros volumes",
    migrationEffort: "high",
    url: "https://www.postgresql.org",
  },
  firebase: {
    name: "Firebase",
    typicalMonthlyEur: 0,
    freeTier: "Plan Spark gratuit (quotas quotidiens)",
    pros: ["Auth, realtime et hosting réunis", "Très bon côté mobile"],
    cons: ["Firestore n'est pas du SQL", "Dépendance forte à Google"],
    bestFor: "Apps mobiles, temps réel simple",
    migrationEffort: "high",
    url: "https://firebase.google.com",
  },
  clerk: {
    name: "Clerk",
    typicalMonthlyEur: 0,
    freeTier: "10 000 utilisateurs actifs par mois",
    pros: ["Composants d'auth prêts à l'emploi", "Excellent DX Next.js"],
    cons: ["Prix qui grimpe avec les MAU", "Moins d'options entreprise qu'Auth0"],
    bestFor: "SaaS B2C, onboarding rapide",
    migrationEffort: "medium",
    url: "https://clerk.com",
  },
  supabase_auth: {
    name: "Supabase Auth",
    typicalMonthlyEur: 0,
    freeTier: "50 000 utilisateurs actifs par mois",
    pros: ["Inclus si tu utilises déjà Supabase", "RLS natif"],
    cons: ["Peu de SSO entreprise", "UI à construire"],
    bestFor: "Stack Supabase, apps indie",
    migrationEffort: "medium",
    url: "https://supabase.com/auth",
  },
  better_auth: {
    name: "Better Auth (self-hosted)",
    typicalMonthlyEur: 0,
    freeTier: "Open source, hébergé avec ton app",
    pros: ["Aucun coût par utilisateur", "Données dans ta base"],
    cons: ["Sécurité et maintenance à ta charge", "Pas de support commercial"],
    bestFor: "Projets TypeScript qui veulent zéro coût d'auth",
    migrationEffort: "medium",
    url: "https://better-auth.com",
  },
  keycloak: {
    name: "Keycloak (auto-hébergé)",
    typicalMonthlyEur: 5,
    freeTier: "Open source, coût = serveur",
    pros: ["SSO et SAML complets", "Open source"],
    cons: ["Maintenance lourde", "UX datée"],
    bestFor: "Contexte entreprise, contrôle IAM",
    migrationEffort: "high",
    url: "https://keycloak.org",
  },
  gitlab: {
    name: "GitLab",
    typicalMonthlyEur: 0,
    freeTier: "Dépôts privés illimités et 400 minutes CI par mois",
    pros: ["CI intégrée", "Auto-hébergement possible"],
    cons: ["Interface différente", "Moins d'intégrations tierces"],
    bestFor: "CI/CD tout-en-un, DevOps",
    migrationEffort: "medium",
    url: "https://gitlab.com",
  },
  forgejo: {
    name: "Codeberg / Forgejo",
    typicalMonthlyEur: 0,
    freeTier: "Gratuit pour les projets open source",
    pros: ["Totalement gratuit", "Léger et open source"],
    cons: ["Pas de marketplace d'actions", "Écosystème restreint"],
    bestFor: "Open source, petits dépôts",
    migrationEffort: "medium",
    url: "https://codeberg.org",
  },
  grafana: {
    name: "Grafana Cloud",
    typicalMonthlyEur: 0,
    freeTier: "10k métriques, 50 Go de logs et 3 utilisateurs",
    pros: ["Dashboards puissants", "Free tier très correct"],
    cons: ["Mise en place plus technique", "Alerting à configurer"],
    bestFor: "Observabilité sur mesure",
    migrationEffort: "medium",
    url: "https://grafana.com",
  },
  better_stack: {
    name: "Better Stack",
    typicalMonthlyEur: 10,
    freeTier: "Uptime et 1 Go de logs gratuits",
    pros: ["Uptime et logs réunis", "Tarif startup"],
    cons: ["Moins complet que Datadog", "Intégrations limitées"],
    bestFor: "Startups qui veulent uptime + logs",
    migrationEffort: "low",
    url: "https://betterstack.com",
  },
  sentry_free: {
    name: "Sentry (plan Developer)",
    typicalMonthlyEur: 0,
    freeTier: "5 000 erreurs par mois",
    pros: ["Traces d'erreur complètes", "Intégration Next.js immédiate"],
    cons: ["Quota vite atteint en production", "Peu de rétention"],
    bestFor: "Suivi d'erreurs sur un projet solo",
    migrationEffort: "low",
    url: "https://sentry.io",
  },
  resend: {
    name: "Resend",
    typicalMonthlyEur: 0,
    freeTier: "3 000 emails par mois, 100 par jour",
    pros: ["DX excellente", "Templates React Email"],
    cons: ["Moins d'options marketing", "Free tier limité au quotidien"],
    bestFor: "Emails transactionnels d'un SaaS",
    migrationEffort: "low",
    url: "https://resend.com",
  },
  ses: {
    name: "Amazon SES",
    typicalMonthlyEur: 1,
    freeTier: "62 000 emails par mois depuis EC2",
    pros: ["Le moins cher à l'échelle", "Très fiable"],
    cons: ["Configuration AWS", "Templates rudimentaires"],
    bestFor: "Gros volumes à coût minimal",
    migrationEffort: "medium",
    url: "https://aws.amazon.com/ses",
  },
  brevo: {
    name: "Brevo",
    typicalMonthlyEur: 0,
    freeTier: "300 emails par jour",
    pros: ["Transactionnel et marketing réunis", "Hébergement UE"],
    cons: ["Délivrabilité moyenne sur le free tier", "Interface chargée"],
    bestFor: "Projets européens avec besoin marketing",
    migrationEffort: "low",
    url: "https://brevo.com",
  },
  cloudflare_r2: {
    name: "Cloudflare R2",
    typicalMonthlyEur: 0,
    freeTier: "10 Go de stockage et zéro frais de sortie",
    pros: ["Pas de frais d'egress", "Compatible S3"],
    cons: ["Écosystème moins mature que S3"],
    bestFor: "Assets, sauvegardes, médias",
    migrationEffort: "low",
    url: "https://developers.cloudflare.com/r2",
  },
  backblaze: {
    name: "Backblaze B2",
    typicalMonthlyEur: 1,
    freeTier: "10 Go de stockage gratuits",
    pros: ["Stockage très bon marché", "Compatible S3"],
    cons: ["Latence supérieure à S3", "Moins d'intégrations"],
    bestFor: "Archives et sauvegardes",
    migrationEffort: "low",
    url: "https://backblaze.com/b2",
  },
};

function option(slug: string): AlternativeOption {
  const seed = OPTIONS[slug];
  return {
    slug,
    name: seed.name,
    typicalMonthlyEur: seed.typicalMonthlyEur,
    freeTier: seed.freeTier,
    pros: seed.pros,
    cons: seed.cons,
    bestFor: seed.bestFor,
    migrationEffort: seed.migrationEffort,
    url: seed.url,
  };
}

export type CatalogProvider = {
  slug: string;
  label: string;
  category: ExpenseCategory;
  /** Lowercase, accent-free fragments that identify the provider in free text. */
  aliases: string[];
  url: string;
  /** What the vendor's own free plan covers, when it has one. */
  freeTier: string | null;
  typicalMonthlyEur: number | null;
  note: string;
  alternativeSlugs: string[];
};

const PROVIDERS: CatalogProvider[] = [
  {
    slug: "vercel",
    label: "Vercel",
    category: "hosting",
    aliases: ["vercel", "vercel pro", "v0"],
    url: "https://vercel.com",
    freeTier: "Plan Hobby gratuit pour les projets non commerciaux",
    typicalMonthlyEur: 20,
    note: "Hébergement et déploiement d'apps Next.js.",
    alternativeSlugs: ["cloudflare", "netlify", "railway", "fly"],
  },
  {
    slug: "netlify",
    label: "Netlify",
    category: "hosting",
    aliases: ["netlify"],
    url: "https://netlify.com",
    freeTier: "100 Go de bande passante par mois",
    typicalMonthlyEur: 19,
    note: "Hébergement de sites statiques et fonctions edge.",
    alternativeSlugs: ["cloudflare", "railway", "fly"],
  },
  {
    slug: "openai",
    label: "OpenAI",
    category: "ai_api",
    aliases: ["openai", "open ai", "chatgpt", "gpt", "chat gpt", "dall e", "whisper"],
    url: "https://openai.com",
    freeTier: null,
    typicalMonthlyEur: 20,
    note: "Modèles GPT via API ou abonnement ChatGPT.",
    alternativeSlugs: ["google_gemini", "groq", "deepseek", "anthropic", "ollama"],
  },
  {
    slug: "anthropic",
    label: "Anthropic",
    category: "ai_api",
    aliases: ["anthropic", "claude", "claude code"],
    url: "https://anthropic.com",
    freeTier: null,
    typicalMonthlyEur: 20,
    note: "Modèles Claude via API ou abonnement.",
    alternativeSlugs: ["google_gemini", "deepseek", "groq", "ollama"],
  },
  {
    slug: "cursor",
    label: "Cursor",
    category: "saas",
    aliases: ["cursor", "cursor pro"],
    url: "https://cursor.com",
    freeTier: "Plan Hobby avec complétions limitées",
    typicalMonthlyEur: 20,
    note: "Éditeur de code assisté par IA.",
    alternativeSlugs: ["ollama"],
  },
  {
    slug: "github",
    label: "GitHub",
    category: "ci_cd",
    aliases: ["github", "github copilot", "copilot", "github actions"],
    url: "https://github.com",
    freeTier: "Dépôts privés illimités et 2 000 minutes d'Actions par mois",
    typicalMonthlyEur: 4,
    note: "Hébergement de code et CI via Actions.",
    alternativeSlugs: ["gitlab", "forgejo"],
  },
  {
    slug: "supabase",
    label: "Supabase",
    category: "database",
    aliases: ["supabase"],
    url: "https://supabase.com",
    freeTier: "Projet gratuit avec 500 Mo de base, mis en pause après inactivité",
    typicalMonthlyEur: 25,
    note: "Postgres managé avec auth, storage et realtime.",
    alternativeSlugs: ["neon", "firebase", "turso", "postgres_vps"],
  },
  {
    slug: "planetscale",
    label: "PlanetScale",
    category: "database",
    aliases: ["planetscale", "planet scale"],
    url: "https://planetscale.com",
    freeTier: null,
    typicalMonthlyEur: 39,
    note: "MySQL managé avec branches de schéma.",
    alternativeSlugs: ["neon", "turso", "postgres_vps"],
  },
  {
    slug: "mongodb",
    label: "MongoDB Atlas",
    category: "database",
    aliases: ["mongodb", "mongo", "atlas"],
    url: "https://mongodb.com/atlas",
    freeTier: "Cluster M0 gratuit (512 Mo)",
    typicalMonthlyEur: 9,
    note: "Base documentaire managée.",
    alternativeSlugs: ["neon", "firebase", "postgres_vps"],
  },
  {
    slug: "auth0",
    label: "Auth0",
    category: "auth",
    aliases: ["auth0", "auth 0", "okta"],
    url: "https://auth0.com",
    freeTier: "25 000 utilisateurs actifs par mois",
    typicalMonthlyEur: 35,
    note: "Authentification et SSO managés.",
    alternativeSlugs: ["clerk", "supabase_auth", "better_auth", "keycloak"],
  },
  {
    slug: "clerk",
    label: "Clerk",
    category: "auth",
    aliases: ["clerk"],
    url: "https://clerk.com",
    freeTier: "10 000 utilisateurs actifs par mois",
    typicalMonthlyEur: 25,
    note: "Auth clé en main avec composants React.",
    alternativeSlugs: ["supabase_auth", "better_auth", "keycloak"],
  },
  {
    slug: "datadog",
    label: "Datadog",
    category: "monitoring",
    aliases: ["datadog", "data dog"],
    url: "https://datadoghq.com",
    freeTier: null,
    typicalMonthlyEur: 60,
    note: "Observabilité complète: métriques, logs, APM.",
    alternativeSlugs: ["grafana", "better_stack", "sentry_free"],
  },
  {
    slug: "sentry",
    label: "Sentry",
    category: "monitoring",
    aliases: ["sentry"],
    url: "https://sentry.io",
    freeTier: "5 000 erreurs par mois",
    typicalMonthlyEur: 26,
    note: "Suivi des erreurs et des performances.",
    alternativeSlugs: ["grafana", "better_stack"],
  },
  {
    slug: "resend",
    label: "Resend",
    category: "email",
    aliases: ["resend"],
    url: "https://resend.com",
    freeTier: "3 000 emails par mois",
    typicalMonthlyEur: 20,
    note: "Envoi d'emails transactionnels.",
    alternativeSlugs: ["ses", "brevo"],
  },
  {
    slug: "sendgrid",
    label: "SendGrid",
    category: "email",
    aliases: ["sendgrid", "send grid", "twilio sendgrid"],
    url: "https://sendgrid.com",
    freeTier: "100 emails par jour",
    typicalMonthlyEur: 20,
    note: "Plateforme d'emails transactionnels et marketing.",
    alternativeSlugs: ["resend", "ses", "brevo"],
  },
  {
    slug: "mailgun",
    label: "Mailgun",
    category: "email",
    aliases: ["mailgun", "mail gun"],
    url: "https://mailgun.com",
    freeTier: null,
    typicalMonthlyEur: 15,
    note: "API d'envoi d'emails.",
    alternativeSlugs: ["resend", "ses", "brevo"],
  },
  {
    slug: "aws",
    label: "AWS",
    category: "hosting",
    aliases: ["aws", "amazon web services", "ec2", "s3", "lambda"],
    url: "https://aws.amazon.com",
    freeTier: "Free tier de 12 mois puis quotas permanents limités",
    typicalMonthlyEur: null,
    note: "Infrastructure cloud à la carte.",
    alternativeSlugs: ["cloudflare", "fly", "railway", "backblaze"],
  },
  {
    slug: "cloudflare",
    label: "Cloudflare",
    category: "hosting",
    aliases: ["cloudflare", "cloud flare", "workers", "r2"],
    url: "https://cloudflare.com",
    freeTier: "Plan gratuit très large sur Pages, Workers et R2",
    typicalMonthlyEur: 5,
    note: "CDN, edge compute et stockage objet.",
    alternativeSlugs: ["netlify", "fly", "backblaze"],
  },
  {
    slug: "figma",
    label: "Figma",
    category: "saas",
    aliases: ["figma"],
    url: "https://figma.com",
    freeTier: "3 fichiers de design par utilisateur",
    typicalMonthlyEur: 15,
    note: "Design d'interface collaboratif.",
    alternativeSlugs: [],
  },
  {
    slug: "notion",
    label: "Notion",
    category: "saas",
    aliases: ["notion"],
    url: "https://notion.so",
    freeTier: "Espace personnel gratuit et illimité",
    typicalMonthlyEur: 10,
    note: "Notes, docs et bases de connaissances.",
    alternativeSlugs: [],
  },
  {
    slug: "linear",
    label: "Linear",
    category: "saas",
    aliases: ["linear"],
    url: "https://linear.app",
    freeTier: "250 issues pour les petites équipes",
    typicalMonthlyEur: 8,
    note: "Suivi des tickets et des sprints.",
    alternativeSlugs: [],
  },
];

const BY_SLUG = new Map(PROVIDERS.map((p) => [p.slug, p]));

const CATEGORY_FALLBACKS: Record<ExpenseCategory, string[]> = {
  ai_api: ["google_gemini", "groq", "deepseek", "ollama"],
  hosting: ["cloudflare", "netlify", "railway", "fly"],
  database: ["neon", "turso", "firebase", "postgres_vps"],
  auth: ["clerk", "supabase_auth", "better_auth"],
  ci_cd: ["gitlab", "forgejo"],
  monitoring: ["grafana", "better_stack", "sentry_free"],
  email: ["resend", "ses", "brevo"],
  storage: ["cloudflare_r2", "backblaze"],
  saas: [],
  other: [],
};

export function findProvider(slug: string | null | undefined): CatalogProvider | null {
  if (!slug) return null;
  return BY_SLUG.get(slug.trim().toLowerCase()) ?? null;
}

/**
 * Best-effort provider match from whatever the user typed. Longer aliases win
 * so "github copilot" is not swallowed by "github".
 */
export function matchProviderFromText(...parts: (string | null | undefined)[]): CatalogProvider | null {
  const haystack = foldCase(parts.filter(Boolean).join(" "));
  if (!haystack) return null;

  let best: { provider: CatalogProvider; length: number } | null = null;

  for (const provider of PROVIDERS) {
    for (const alias of provider.aliases) {
      const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegex(alias)}([^a-z0-9]|$)`);
      if (!pattern.test(haystack)) continue;
      if (!best || alias.length > best.length) {
        best = { provider, length: alias.length };
      }
    }
  }

  return best?.provider ?? null;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Alternatives for a provider, falling back to the category's usual suspects. */
export function alternativesFor(
  slug: string | null | undefined,
  category: ExpenseCategory,
): AlternativeOption[] {
  const provider = findProvider(slug);
  const slugs = provider?.alternativeSlugs.length
    ? provider.alternativeSlugs
    : CATEGORY_FALLBACKS[category] ?? [];

  return slugs.filter((s) => OPTIONS[s]).map(option);
}

/**
 * Instant, offline guess used while the model thinks and whenever no LLM is
 * configured. Confidence stays low so the UI never presents it as certain.
 */
export function suggestProviderFromCatalog(
  name: string,
  websiteUrl?: string | null,
  notes?: string | null,
): ProviderSuggestion | null {
  const provider = matchProviderFromText(name, websiteUrl, notes);
  if (!provider) return null;

  return {
    canonicalName: provider.label,
    providerSlug: provider.slug,
    category: provider.category,
    billingCycle: "monthly",
    websiteUrl: provider.url,
    typicalMonthlyEur: provider.typicalMonthlyEur,
    freeTier: provider.freeTier,
    note: provider.note,
    confidence: 0.6,
    source: "catalog",
    alternatives: [],
  };
}