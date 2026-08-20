import { generateText, Output, type LanguageModel } from "ai";
import { z } from "zod";
import {
  isLlmAvailable,
  isRateLimitError,
  resolveLlmModel,
  sleep,
} from "@/lib/ai/model";
import { sanitizePlainText } from "@/modules/ai-intel/html-to-text";
import type { HubLocale } from "@/core/i18n";
import type { OrganizedIntel } from "@/modules/ai-intel/organize-intel";

export const LLM_CONTENT_KINDS = [
  "repo",
  "tool",
  "feature",
  "model",
  "pricing",
  "breaking",
  "security",
  "policy",
  "news",
] as const;

export type LlmContentKind = (typeof LLM_CONTENT_KINDS)[number];

export const LLM_URGENCIES = ["urgent", "medium", "light"] as const;
export type LlmUrgency = (typeof LLM_URGENCIES)[number];

const intelSchema = z.object({
  title: z
    .string()
    .max(90)
    .describe("Titre court « Nom : un fait utile pour un dev », sans chrome de page"),
  purpose: z
    .string()
    .max(220)
    .describe("Une phrase qui dit exactement de quoi il s'agit"),
  essentialPoints: z
    .array(z.string().max(240))
    .min(2)
    .max(5)
    .describe("Points factuels: ce que c'est, chiffres, changement concret"),
  contentKind: z
    .enum(LLM_CONTENT_KINDS)
    .describe("Nature réelle du contenu après lecture"),
  urgency: z.enum(LLM_URGENCIES).describe("Niveau d'urgence pour un dev"),
  actionRequired: z
    .boolean()
    .describe("true seulement si le dev doit agir (migrer, patcher, vérifier son plan)"),
  impact: z
    .string()
    .max(240)
    .describe("Conséquence concrète pour un dev, ou pourquoi ça ne change rien"),
  tags: z
    .array(z.string().max(24))
    .min(2)
    .max(4)
    .describe("Étiquettes techniques précises, jamais génériques"),
  score: z.number().int().min(0).max(100).describe("Intérêt réel pour un dev"),
  scoreReason: z.string().max(180).describe("Justification courte du score"),
});

export type LlmIntelDecision = OrganizedIntel & {
  model: string;
  contentKind: LlmContentKind;
  urgency: LlmUrgency;
  actionRequired: boolean;
  impact: string;
  tags: string[];
  score: number;
  scoreReason: string;
};

const DEFAULT_BUDGET = 80;
const MAX_SOURCE_CHARS = 14_000;
/** Google's free tier throttles per minute, so calls are spaced instead of bursted. */
const DEFAULT_MIN_INTERVAL_MS = 4_000;
const RATE_LIMIT_RETRY_MS = 20_000;

let llmBudget = DEFAULT_BUDGET;
let nextCallAt = 0;

export function resetLlmOrganizeBudget() {
  llmBudget = Number(process.env.AI_INTEL_LLM_BUDGET || DEFAULT_BUDGET);
  nextCallAt = 0;
}

/** Reserve the next slot so concurrent callers never fire at the same instant. */
async function waitForSlot(): Promise<void> {
  const interval = Number(
    process.env.AI_INTEL_LLM_MIN_INTERVAL_MS || DEFAULT_MIN_INTERVAL_MS,
  );
  const now = Date.now();
  const slot = Math.max(now, nextCallAt);
  nextCallAt = slot + interval;
  if (slot > now) await sleep(slot - now);
}

export function remainingLlmBudget(): number {
  return llmBudget;
}

/** True when a Gemini provider is configured (Google free tier or Vercel AI Gateway). */
export function isLlmOrganizeAvailable(): boolean {
  return isLlmAvailable();
}

function resolveModel() {
  return resolveLlmModel(process.env.AI_INTEL_LLM_MODEL);
}

const URGENCY_RUBRIC = [
  "urgent — uniquement trois cas:",
  "  1) faille de sécurité / CVE / vulnérabilité sur un outil, une lib ou un service qu'un dev utilise;",
  "  2) changement de prix concret (hausse, fin de free tier, nouveau tarif) d'un LLM ou d'un service dev;",
  "  3) outil vraiment révolutionnaire (change la façon de coder, pas un clone ni une mise à jour mineure).",
  "  JAMAIS urgent: changelog, nouveau modèle, dépréciation, panne, repo GitHub qui explose, actu, marketing.",
  "medium — à connaître cette semaine: breaking / dépréciation, nouveau modèle, release, nouvel outil utile, panne.",
  "light — contexte, opinion, actu générale, annonce marketing, sujet non technique.",
].join("\n");

function buildPrompt(input: {
  name: string;
  declaredKind: "repo" | "tool" | "news";
  url?: string | null;
  source?: string | null;
  publishedAt?: string | null;
  description?: string;
  metrics?: string;
  sourceText: string;
  locale: HubLocale;
}): string {
  const lang =
    input.locale === "fr"
      ? "Rédige tous les textes en français."
      : "Write every text field in English.";

  const declared =
    input.declaredKind === "repo"
      ? "dépôt GitHub"
      : input.declaredKind === "tool"
        ? "outil IA / SaaS"
        : "article ou annonce";

  return [
    "Tu es l'analyste d'une veille technique destinée à un développeur qui construit des apps IA.",
    "Tu lis le contenu de l'article ou du dépôt et tu décides toi-même de quoi il s'agit et si ça mérite une alerte.",
    lang,
    "",
    "Niveaux d'urgence:",
    URGENCY_RUBRIC,
    "",
    "Règles:",
    "- title: « Nom : un fait utile » en une ligne courte. Jamais une phrase du README, jamais « Back to changelog », jamais un nombre de stars, jamais un tiret long (—).",
    "- purpose: une phrase concrète pour un dev (ce que ça fait, ce qui change, CVE, prix). Pas de marketing ni de navigation.",
    "- essentialPoints: 3 à 5 faits utiles tirés du contenu (changement, chiffres réels, langage, ce que ça remplace). Ignore cookies, nav, changelog chrome.",
    "- impact: la conséquence concrète pour le dev. Si aucune, dis-le franchement.",
    "- actionRequired: true uniquement si une action est nécessaire (patcher, migrer, vérifier son plan ou ses coûts).",
    "- tags: 2 à 4 étiquettes techniques précises (ex: « MCP », « Sécurité », « Pricing », « TypeScript », « Agents »). Interdit: « IA », « Tech », « Nouveauté », « Outil ».",
    "- score 0-100: intérêt réel pour ce dev. >=80 impose une action ou change ses coûts. 60-79 très utile. 40-59 intéressant. <40 anecdotique.",
    "- N'invente jamais un chiffre absent du contenu. Ignore la pub, les cookies, la navigation.",
    "",
    `Type annoncé par la source: ${declared}`,
    `Nom: ${input.name}`,
    input.source ? `Source: ${input.source}` : "",
    input.url ? `URL: ${input.url}` : "",
    input.publishedAt ? `Publié: ${input.publishedAt}` : "",
    input.description ? `Description courte: ${input.description}` : "",
    input.metrics ? `Métriques mesurées: ${input.metrics}` : "",
    "",
    "Contenu :",
    input.sourceText,
  ]
    .filter(Boolean)
    .join("\n");
}

function cleanTags(tags: string[]): string[] {
  const banned = /^(ia|ai|tech|technologie|nouveauté|news|actu|outil|tool|général)$/i;
  const seen = new Set<string>();
  const out: string[] = [];

  for (const raw of tags) {
    const tag = sanitizePlainText(raw, 24).replace(/[.;,]+$/, "").trim();
    if (!tag || tag.length < 2 || banned.test(tag)) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }

  return out.slice(0, 4);
}

type IntelDecisionOutput = z.infer<typeof intelSchema>;

/** One call, retried once when the free tier throttles us. */
async function requestDecision(
  model: LanguageModel | string,
  prompt: string,
  name: string,
): Promise<IntelDecisionOutput | null> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await waitForSlot();
    try {
      const { output } = await generateText({
        model,
        output: Output.object({
          schema: intelSchema,
          name: "intel_decision",
          description:
            "Title, summary, essential points, kind, urgency, impact, tags and score",
        }),
        prompt,
        maxOutputTokens: 1400,
      });
      return output ?? null;
    } catch (err) {
      if (attempt > 0 || !isRateLimitError(err)) throw err;
      if (process.env.AI_INTEL_LLM_DEBUG) {
        console.warn(`[ai-intel] LLM throttled for "${name}", retrying…`);
      }
      await sleep(RATE_LIMIT_RETRY_MS);
    }
  }
  return null;
}

/**
 * Read the scraped content with Gemini and decide what it is, how urgent it is,
 * and what a developer should retain. Returns null when no API key, budget
 * exhausted, content too thin, or the call fails — callers fall back to heuristics.
 */
export async function llmOrganizeIntel(input: {
  kind: "repo" | "tool" | "news";
  name: string;
  description?: string | null;
  metrics?: string | null;
  sourceText: string;
  url?: string | null;
  source?: string | null;
  publishedAt?: string | null;
  locale?: HubLocale;
}): Promise<LlmIntelDecision | null> {
  if (!isLlmOrganizeAvailable() || llmBudget <= 0) return null;

  const sourceText = sanitizePlainText(input.sourceText, MAX_SOURCE_CHARS);
  if (sourceText.length < 60) return null;

  llmBudget -= 1;
  const locale = input.locale ?? "fr";
  const { model, label: modelLabel } = resolveModel();
  const prompt = buildPrompt({
    name: input.name,
    declaredKind: input.kind,
    url: input.url,
    source: input.source,
    publishedAt: input.publishedAt,
    description: input.description?.trim() || undefined,
    metrics: input.metrics?.trim() || undefined,
    sourceText,
    locale,
  });

  try {
    const output = await requestDecision(model, prompt, input.name);
    if (!output) return null;

    const title = sanitizePlainText(output.title, 120);
    const purpose = sanitizePlainText(output.purpose, 220);
    const essentialPoints = output.essentialPoints
      .map((p) => sanitizePlainText(p, 240))
      .filter((p) => p.length >= 12);

    if (!title || !purpose || essentialPoints.length < 2) return null;

    const impact = sanitizePlainText(output.impact, 240);
    const longAbout = [purpose, ...essentialPoints, impact]
      .filter(Boolean)
      .join("\n\n")
      .slice(0, 2400);

    return {
      title,
      purpose,
      essentialPoints: essentialPoints.slice(0, 5),
      longAbout,
      model: modelLabel,
      contentKind: output.contentKind,
      urgency: output.urgency,
      actionRequired: output.actionRequired === true,
      impact,
      tags: cleanTags(output.tags),
      score: Math.max(0, Math.min(100, Math.round(output.score))),
      scoreReason: sanitizePlainText(output.scoreReason, 180),
    };
  } catch (err) {
    if (process.env.AI_INTEL_LLM_DEBUG) {
      console.warn(
        `[ai-intel] LLM failed for "${input.name}":`,
        err instanceof Error ? err.message : err,
      );
    }
    return null;
  }
}
