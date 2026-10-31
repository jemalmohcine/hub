import { generateText, Output } from "ai";
import { z } from "zod";
import { isLlmAvailable, isRateLimitError, resolveLlmModel, sleep } from "@/lib/ai/model";
import { collapseWhitespace } from "@/lib/text";
import { EXPENSE_CATEGORIES } from "@/modules/dev-expenses/types";
import {
  AUDIENCES,
  PRICING_MODELS,
  type Audience,
  type PricingModel,
  type ToolCategory,
} from "@/modules/dev-tools/types";

/**
 * Reads what the scrape found and turns it into a catalogue row: what the tool
 * is for, what its free plan really covers, and who should use it. Returns
 * null on any failure so the ingest keeps the measured facts and drops only
 * the editorial layer.
 */

const DEFAULT_BUDGET = 70;
const MIN_INTERVAL_MS = 4_000;
const RETRY_MS = 20_000;

let budget = DEFAULT_BUDGET;
let nextCallAt = 0;

export function resetToolLlmBudget() {
  budget = Number(process.env.DEV_TOOLS_LLM_BUDGET || DEFAULT_BUDGET);
  nextCallAt = 0;
}

export function remainingToolLlmBudget(): number {
  return budget;
}

export function isToolLlmAvailable(): boolean {
  return isLlmAvailable();
}

async function waitForSlot(): Promise<void> {
  const interval = Number(process.env.DEV_TOOLS_LLM_MIN_INTERVAL_MS || MIN_INTERVAL_MS);
  const now = Date.now();
  const slot = Math.max(now, nextCallAt);
  nextCallAt = slot + interval;
  if (slot > now) await sleep(slot - now);
}

const classificationSchema = z.object({
  isRealTool: z
    .boolean()
    .describe(
      "false pour une liste de liens, un cours, une démo, un dotfiles ou une bibliothèque de composants sans produit",
    ),
  name: z.string().max(60).describe("Nom commercial du produit"),
  category: z.enum(EXPENSE_CATEGORIES),
  tagline: z.string().max(110).describe("Une ligne : ce que fait l'outil, sans superlatif"),
  summary: z.string().max(320).describe("Deux phrases : à quoi il sert et ce qui le distingue"),
  pricingModel: z.enum(PRICING_MODELS),
  hasFreeTier: z
    .boolean()
    .describe("true seulement pour un plan gratuit permanent, jamais pour un essai"),
  freeTierNote: z
    .string()
    .max(180)
    .nullable()
    .describe("Ce que couvre concrètement le plan gratuit, avec ses quotas"),
  startingPriceEur: z
    .number()
    .nullable()
    .describe("Prix mensuel du premier plan payant en euros, null si inconnu ou à l'usage"),
  audience: z.enum(AUDIENCES),
  bestFor: z.string().max(120).describe("Le cas où cet outil est le bon choix"),
  pros: z.array(z.string().max(90)).min(1).max(3),
  cons: z.array(z.string().max(90)).min(1).max(3),
  tags: z.array(z.string().max(24)).min(2).max(4).describe("Étiquettes techniques précises"),
  alternatives: z.array(z.string().max(40)).max(3).describe("Concurrents directs, par leur nom"),
  adoption: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe("Notoriété réelle chez les développeurs. 90+ = tout le monde connaît"),
  reliability: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe("Fiabilité pour un projet en production : ancienneté, gouvernance, support"),
});

export type ToolClassification = {
  isRealTool: boolean;
  name: string;
  category: ToolCategory;
  tagline: string;
  summary: string;
  pricingModel: PricingModel;
  hasFreeTier: boolean;
  freeTierNote: string | null;
  startingPriceEur: number | null;
  audience: Audience;
  bestFor: string;
  pros: string[];
  cons: string[];
  tags: string[];
  alternatives: string[];
  adoption: number;
  reliability: number;
};

function buildPrompt(input: ClassifyInput): string {
  return [
    "Tu documentes un catalogue d'outils pour développeurs indépendants qui surveillent leur budget.",
    "Réponds en français, factuellement, sans langage marketing.",
    "",
    "Règles:",
    "- hasFreeTier: true uniquement pour un plan gratuit permanent. Un essai de 14 jours n'en est pas un.",
    "- freeTierNote: reprends les quotas réels du plan gratuit. Si tu ne les connais pas, mets null.",
    "- startingPriceEur: le premier palier payant, par mois. Null si le tarif est à l'usage ou introuvable.",
    "- N'invente aucun prix ni quota absent des informations fournies et de ta connaissance du produit.",
    "- isRealTool: false si c'est une liste « awesome », un tutoriel, un dépôt de démo ou un projet abandonné.",
    "- pros et cons: concrets et opposables, jamais « facile à utiliser ».",
    "- adoption et reliability: ton évaluation honnête, y compris quand elle est basse.",
    "",
    `Nom: ${input.name}`,
    `Catégorie supposée: ${input.category}`,
    input.websiteUrl ? `Site: ${input.websiteUrl}` : "",
    input.repoFullName ? `Dépôt: ${input.repoFullName}` : "",
    input.description ? `Description du dépôt: ${input.description}` : "",
    input.topics?.length ? `Topics: ${input.topics.join(", ")}` : "",
    input.license ? `Licence: ${input.license}` : "",
    input.stars != null ? `Étoiles GitHub: ${input.stars}` : "",
    input.pricingText ? `\nPage de tarifs scrapée:\n${input.pricingText}` : "\nAucune page de tarifs lisible.",
  ]
    .filter(Boolean)
    .join("\n");
}

export type ClassifyInput = {
  name: string;
  category: ToolCategory;
  websiteUrl?: string | null;
  repoFullName?: string | null;
  description?: string | null;
  topics?: string[];
  license?: string | null;
  stars?: number | null;
  pricingText?: string | null;
};

export async function classifyTool(input: ClassifyInput): Promise<ToolClassification | null> {
  if (!isToolLlmAvailable() || budget <= 0) return null;
  budget -= 1;

  const { model } = resolveLlmModel(
    process.env.DEV_TOOLS_LLM_MODEL || process.env.AI_INTEL_LLM_MODEL,
  );
  const prompt = buildPrompt(input);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    await waitForSlot();
    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: classificationSchema, name: "tool_classification" }),
        prompt,
        maxOutputTokens: 1200,
      });
      if (!output) return null;

      return {
        isRealTool: output.isRealTool !== false,
        name: collapseWhitespace(output.name) || input.name,
        category: output.category,
        tagline: collapseWhitespace(output.tagline),
        summary: collapseWhitespace(output.summary),
        pricingModel: output.pricingModel,
        hasFreeTier: output.hasFreeTier === true,
        freeTierNote: output.freeTierNote ? collapseWhitespace(output.freeTierNote) : null,
        startingPriceEur: normalizePrice(output.startingPriceEur),
        audience: output.audience,
        bestFor: collapseWhitespace(output.bestFor),
        pros: cleanList(output.pros, 3),
        cons: cleanList(output.cons, 3),
        tags: cleanList(output.tags, 4),
        alternatives: cleanList(output.alternatives, 3),
        adoption: clamp(output.adoption),
        reliability: clamp(output.reliability),
      };
    } catch (err) {
      if (attempt > 0 || !isRateLimitError(err)) {
        if (process.env.DEV_TOOLS_LLM_DEBUG) {
          console.warn(
            `[dev-tools] classification failed for ${input.name}:`,
            err instanceof Error ? err.message : err,
          );
        }
        return null;
      }
      await sleep(RETRY_MS);
    }
  }

  return null;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizePrice(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value) || value <= 0 || value > 5_000) return null;
  return Math.round(value * 100) / 100;
}

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
