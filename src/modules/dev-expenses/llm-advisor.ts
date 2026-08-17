import { generateText, Output } from "ai";
import { z } from "zod";
import { isLlmAvailable, isRateLimitError, resolveLlmModel, sleep } from "@/lib/ai/model";
import { slugify } from "@/lib/slug";
import { collapseWhitespace, truncateAtWord } from "@/lib/text";
import { matchProviderFromText } from "@/modules/dev-expenses/catalog";
import type {
  BudgetDiagnostic,
  ExpenseDiagnostic,
  ProviderSuggestion,
  ServiceWithStats,
} from "@/modules/dev-expenses/types";
import {
  BILLING_CYCLES,
  BUDGET_FINDING_KINDS,
  CATEGORY_LABELS,
  EXPENSE_CATEGORIES,
  MIGRATION_EFFORTS,
} from "@/modules/dev-expenses/types";

/**
 * The intelligent half of the expenses module. Everything here returns null on
 * failure so callers fall back to `diagnose.ts`; the UI is never blocked by a
 * missing API key or a throttled free tier.
 */

const RATE_LIMIT_RETRY_MS = 8_000;

export function isExpenseAiAvailable(): boolean {
  return isLlmAvailable();
}

function model() {
  return resolveLlmModel(process.env.EXPENSES_LLM_MODEL || process.env.AI_INTEL_LLM_MODEL);
}

/** One structured call, retried once when the free tier throttles us. */
async function ask<S extends z.ZodType>(
  schema: S,
  name: string,
  prompt: string,
  maxOutputTokens: number,
): Promise<z.infer<S> | null> {
  const { model: resolved } = model();

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const { output } = await generateText({
        model: resolved,
        output: Output.object({ schema, name }),
        prompt,
        maxOutputTokens,
      });
      return (output as z.infer<S> | undefined) ?? null;
    } catch (err) {
      if (attempt > 0 || !isRateLimitError(err)) {
        if (process.env.EXPENSES_LLM_DEBUG) {
          console.warn(`[expenses] ${name} failed:`, err instanceof Error ? err.message : err);
        }
        return null;
      }
      await sleep(RATE_LIMIT_RETRY_MS);
    }
  }

  return null;
}

const RULES = [
  "Tu conseilles un développeur indépendant qui paie son stack de sa poche.",
  "Réponds en français, sans jargon marketing et sans phrase de politesse.",
  "N'invente jamais un prix : si tu n'es pas sûr, mets null plutôt qu'une estimation fantaisiste.",
  "Les prix sont des ordres de grandeur mensuels en euros, TTC indifférent.",
].join("\n");

// ---------------------------------------------------------------- provider

const providerSchema = z.object({
  canonicalName: z.string().max(60).describe("Nom officiel du service, ex. « OpenAI API »"),
  providerSlug: z
    .string()
    .max(40)
    .describe("Identifiant en minuscules sans espace, ex. « openai », « github_copilot »"),
  category: z.enum(EXPENSE_CATEGORIES).describe("Catégorie réelle du service"),
  billingCycle: z.enum(BILLING_CYCLES).describe("Mode de facturation le plus probable"),
  websiteUrl: z.string().max(120).nullable().describe("URL officielle, sinon null"),
  typicalMonthlyEur: z
    .number()
    .nullable()
    .describe("Prix mensuel typique du plan payant d'entrée, null si usage variable"),
  freeTier: z
    .string()
    .max(180)
    .nullable()
    .describe("Ce que couvre le plan gratuit officiel, null s'il n'y en a pas"),
  note: z.string().max(140).describe("Une phrase : à quoi sert ce service"),
  confidence: z.number().min(0).max(1).describe("Certitude de la reconnaissance"),
});

/**
 * Turn whatever the user typed ("chatgpt plus", "vercel pro 20€") into a
 * structured provider so they never have to pick from a dropdown.
 */
export async function llmIdentifyProvider(input: {
  name: string;
  websiteUrl?: string | null;
  notes?: string | null;
  amountEur?: number | null;
}): Promise<ProviderSuggestion | null> {
  if (!isExpenseAiAvailable()) return null;

  const name = collapseWhitespace(input.name).slice(0, 120);
  if (name.length < 2) return null;

  const hint = matchProviderFromText(name, input.websiteUrl, input.notes);

  const prompt = [
    RULES,
    "",
    "Identifie le service payé à partir de ce que l'utilisateur a saisi.",
    "Le libellé peut être approximatif, mal orthographié ou contenir le nom du plan.",
    "Si le libellé ne correspond à aucun service connu, garde le nom tel quel, mets confidence bas",
    "et choisis la catégorie la plus plausible.",
    "",
    `Saisie: ${name}`,
    input.websiteUrl ? `URL indiquée: ${input.websiteUrl}` : "",
    input.notes ? `Notes: ${collapseWhitespace(input.notes).slice(0, 200)}` : "",
    input.amountEur != null ? `Montant saisi: ${input.amountEur} €` : "",
    hint ? `Correspondance probable dans le catalogue interne: ${hint.label} (${hint.slug})` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const output = await ask(providerSchema, "provider_identification", prompt, 500);
  if (!output) return null;

  const canonicalName = collapseWhitespace(output.canonicalName);
  const providerSlug = output.providerSlug.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_");
  if (!canonicalName || !providerSlug) return null;

  return {
    canonicalName,
    providerSlug,
    category: output.category,
    billingCycle: output.billingCycle,
    websiteUrl: normalizeUrl(output.websiteUrl) ?? hint?.url ?? null,
    typicalMonthlyEur: normalizePrice(output.typicalMonthlyEur),
    freeTier: output.freeTier ? collapseWhitespace(output.freeTier) : null,
    note: collapseWhitespace(output.note),
    confidence: Math.max(0, Math.min(1, output.confidence)),
    source: "ai",
    alternatives: [],
  };
}

// -------------------------------------------------------------- diagnostic

const alternativeSchema = z.object({
  name: z.string().max(60),
  typicalMonthlyEur: z.number().nullable().describe("Coût mensuel typique, null si variable"),
  freeTier: z.string().max(160).nullable().describe("Ce que couvre son plan gratuit, sinon null"),
  pros: z.array(z.string().max(90)).min(1).max(3),
  cons: z.array(z.string().max(90)).min(1).max(3),
  bestFor: z.string().max(110).describe("Le cas d'usage où cette option gagne"),
  migrationEffort: z.enum(MIGRATION_EFFORTS),
  url: z.string().max(120).nullable(),
});

const diagnosticSchema = z.object({
  verdict: z.enum(["keep", "review", "consider_switch"]),
  verdictLabel: z.string().max(48).describe("Verdict en trois mots maximum"),
  summary: z.string().max(320).describe("Deux phrases : ce que coûte ce poste et quoi en faire"),
  potentialSavingsEur: z
    .number()
    .nullable()
    .describe("Économie mensuelle réaliste en euros, null si aucune"),
  alternatives: z.array(alternativeSchema).max(3),
  actions: z
    .array(z.string().max(160))
    .max(3)
    .describe("Étapes concrètes, la plus rentable d'abord"),
  risks: z.array(z.string().max(160)).max(2).describe("Ce qui se dégrade en changeant"),
});

export async function llmDiagnoseService(input: {
  service: ServiceWithStats;
  monthlySpendEur: number;
  shareOfBudgetPct: number;
  totalMonthlyEur: number;
  otherServices: { name: string; category: string; monthlyEur: number }[];
  /** Pre-formatted rows from the scraped catalogue, measured today. */
  candidates: string[];
}): Promise<ExpenseDiagnostic | null> {
  if (!isExpenseAiAvailable()) return null;

  const { service } = input;
  const stack = input.otherServices
    .map((s) => `- ${s.name} (${s.category}) : ${s.monthlyEur} €/mois`)
    .join("\n");

  const prompt = [
    RULES,
    "",
    "Analyse une ligne de dépense et dis si elle vaut son prix.",
    "Propose au maximum trois alternatives réellement moins chères, gratuites en priorité,",
    "qui couvrent le même usage. Ignore les alternatives qui coûtent plus cher.",
    "Tiens compte du reste du stack : une alternative déjà payée par ailleurs vaut mieux qu'un nouvel outil.",
    input.candidates.length
      ? "Les candidats ci-dessous viennent d'un catalogue mesuré aujourd'hui (tarifs, notoriété, stabilité). Sers-t'en en priorité et reprends leurs chiffres tels quels."
      : "",
    "verdict : keep si le prix est justifié, review s'il faut vérifier l'usage,",
    "consider_switch s'il existe une option nettement moins chère et crédible.",
    "",
    `Service: ${service.name}`,
    service.providerSlug ? `Provider: ${service.providerSlug}` : "",
    `Catégorie: ${CATEGORY_LABELS[service.category]}`,
    `Facturation: ${service.billingCycle}`,
    `Coût réel ce mois: ${input.monthlySpendEur} €`,
    `Part du budget dev: ${input.shareOfBudgetPct}%`,
    `Budget dev total: ${input.totalMonthlyEur} €/mois`,
    service.notes ? `Notes de l'utilisateur: ${collapseWhitespace(service.notes).slice(0, 300)}` : "",
    stack ? `Reste du stack:\n${stack}` : "",
    input.candidates.length
      ? `Catalogue d'alternatives mesurées:\n${input.candidates.join("\n")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const output = await ask(diagnosticSchema, "expense_diagnostic", prompt, 1400);
  if (!output) return null;

  const summary = collapseWhitespace(output.summary);
  if (summary.length < 20) return null;

  return {
    verdict: output.verdict,
    verdictLabel: collapseWhitespace(output.verdictLabel) || "Diagnostic",
    summary,
    monthlySpendEur: input.monthlySpendEur,
    shareOfBudgetPct: input.shareOfBudgetPct,
    alternatives: output.alternatives
      .map((alt, index) => ({
        name: collapseWhitespace(alt.name),
        slug: slugify(alt.name, `alt-${index}`),
        typicalMonthlyEur: normalizePrice(alt.typicalMonthlyEur),
        freeTier: alt.freeTier ? collapseWhitespace(alt.freeTier) : null,
        pros: cleanList(alt.pros, 3),
        cons: cleanList(alt.cons, 3),
        bestFor: collapseWhitespace(alt.bestFor),
        migrationEffort: alt.migrationEffort,
        url: normalizeUrl(alt.url),
      }))
      .filter((alt) => alt.name.length > 1),
    potentialSavingsEur: normalizePrice(output.potentialSavingsEur),
    actions: cleanList(output.actions, 3),
    risks: cleanList(output.risks, 2),
    source: "ai",
  };
}

// ------------------------------------------------------------ whole budget

const findingSchema = z.object({
  kind: z.enum(BUDGET_FINDING_KINDS),
  title: z.string().max(90).describe("Le constat en une ligne"),
  detail: z.string().max(320).describe("Pourquoi, avec les chiffres de l'utilisateur"),
  services: z.array(z.string().max(60)).max(4).describe("Noms exacts des services concernés"),
  monthlySavingsEur: z.number().nullable(),
  effort: z.enum(MIGRATION_EFFORTS),
  recommendation: z.string().max(200).describe("L'action à faire, à l'impératif"),
});

const budgetSchema = z.object({
  headline: z.string().max(90).describe("Le message principal, chiffré si possible"),
  summary: z.string().max(340).describe("Deux à trois phrases sur l'état du budget"),
  healthScore: z.number().int().min(0).max(100).describe("100 = budget parfaitement calibré"),
  monthlySavingsEur: z.number().min(0).describe("Somme réaliste des économies mensuelles"),
  findings: z.array(findingSchema).min(1).max(6),
  quickWins: z
    .array(z.string().max(160))
    .max(3)
    .describe("Actions faisables aujourd'hui sans migration"),
});

/**
 * Reads the whole stack at once: that is where the real money is, because
 * duplicates and overlaps are invisible service by service.
 */
export async function llmDiagnoseBudget(input: {
  services: { name: string; category: string; billingCycle: string; monthlyEur: number; notes: string | null }[];
  totalMonthlyEur: number;
  ytdEur: number;
  /** Cheaper or free options per category, from the scraped catalogue. */
  candidates: string[];
}): Promise<BudgetDiagnostic | null> {
  if (!isExpenseAiAvailable() || input.services.length === 0) return null;

  const lines = input.services
    .map(
      (s) =>
        `- ${s.name} | ${s.category} | ${s.billingCycle} | ${s.monthlyEur} €/mois${
          s.notes ? ` | notes: ${truncateAtWord(s.notes, 120)}` : ""
        }`,
    )
    .join("\n");

  const prompt = [
    RULES,
    "",
    "Analyse l'intégralité du budget outils d'un développeur et sors les décisions qui rapportent.",
    "Cherche en priorité, dans cet ordre :",
    "1. les doublons : deux services qui font le même travail,",
    "2. les services payés alors qu'un plan gratuit officiel couvrirait cet usage,",
    "3. les alternatives gratuites ou nettement moins chères pour les gros postes,",
    "4. les outils regroupables sous un seul abonnement,",
    "5. les postes en facturation à l'usage qui peuvent déraper.",
    "Chaque constat cite les services concernés par leur nom exact et chiffre l'économie quand elle est estimable.",
    "N'invente pas de doublon là où il n'y en a pas : si le budget est sain, dis-le avec un constat « healthy ».",
    "monthlySavingsEur global = somme des économies que tu juges réellement atteignables, sans double comptage.",
    input.candidates.length
      ? "Quand tu proposes un remplacement, prends-le dans le catalogue mesuré fourni et reprends ses chiffres."
      : "",
    "",
    `Budget total: ${input.totalMonthlyEur} €/mois (cumul annuel constaté: ${input.ytdEur} €)`,
    `Services (${input.services.length}):`,
    lines,
    input.candidates.length
      ? `\nCatalogue d'alternatives mesurées:\n${input.candidates.join("\n")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const output = await ask(budgetSchema, "budget_diagnostic", prompt, 2200);
  if (!output) return null;

  const findings = output.findings
    .map((f) => ({
      kind: f.kind,
      title: collapseWhitespace(f.title),
      detail: collapseWhitespace(f.detail),
      services: cleanList(f.services, 4),
      monthlySavingsEur: normalizePrice(f.monthlySavingsEur),
      effort: f.effort,
      recommendation: collapseWhitespace(f.recommendation),
    }))
    .filter((f) => f.title.length > 3 && f.detail.length > 10);

  if (findings.length === 0) return null;

  return {
    headline: collapseWhitespace(output.headline),
    summary: collapseWhitespace(output.summary),
    healthScore: Math.max(0, Math.min(100, Math.round(output.healthScore))),
    monthlySavingsEur: Math.max(0, Math.round(output.monthlySavingsEur)),
    findings,
    quickWins: cleanList(output.quickWins, 3),
    source: "ai",
    generatedAt: new Date().toISOString(),
  };
}

// ------------------------------------------------------------------ utils

function cleanList(values: string[], max: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const raw of values) {
    const value = collapseWhitespace(raw);
    if (value.length < 2) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
    if (out.length === max) break;
  }

  return out;
}

function normalizePrice(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100) / 100;
}

function normalizeUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withScheme).toString();
  } catch {
    return null;
  }
}