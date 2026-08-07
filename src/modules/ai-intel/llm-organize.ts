import { google } from "@ai-sdk/google";
import { generateText, Output, type LanguageModel } from "ai";
import { z } from "zod";
import { sanitizePlainText } from "@/modules/ai-intel/html-to-text";
import type { AiLocale } from "@/modules/ai-intel/i18n/locale";
import type { OrganizedIntel } from "@/modules/ai-intel/organize-intel";

const organizeSchema = z.object({
  title: z.string().max(120).describe("Short title: name — what it is"),
  purpose: z.string().max(200).describe("One sentence explaining what it is"),
  essentialPoints: z
    .array(z.string().max(220))
    .min(2)
    .max(4)
    .describe("2-4 bullets: what it is, key signal, dev impact"),
});

const DEFAULT_GEMINI_MODEL = "gemini-3.6-flash";
const DEFAULT_GATEWAY_MODEL = "google/gemini-3.6-flash";

let llmBudget = 25;

export function resetLlmOrganizeBudget() {
  llmBudget = Number(process.env.AI_INTEL_LLM_BUDGET || 25);
}

function hasGoogleFreeApiKey(): boolean {
  return Boolean(
    process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY,
  );
}

/** True when a Gemini provider is configured (Google free tier or Vercel AI Gateway). */
export function isLlmOrganizeAvailable(): boolean {
  return (
    hasGoogleFreeApiKey() ||
    Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN)
  );
}

function resolveModel(): { model: LanguageModel | string; label: string } {
  const configured = (process.env.AI_INTEL_LLM_MODEL || "").trim();

  if (hasGoogleFreeApiKey()) {
    const modelId = configured.includes("/")
      ? configured.split("/").pop() || DEFAULT_GEMINI_MODEL
      : configured || DEFAULT_GEMINI_MODEL;
    return { model: google(modelId), label: modelId };
  }

  const gatewayModel = configured || DEFAULT_GATEWAY_MODEL;
  return { model: gatewayModel, label: gatewayModel };
}

function buildPrompt(input: {
  kind: "repo" | "tool" | "news";
  name: string;
  description?: string;
  metrics?: string;
  sourceText: string;
  locale: AiLocale;
}): string {
  const lang =
    input.locale === "fr"
      ? "Réponds entièrement en français."
      : "Respond entirely in English.";

  const kindLabel =
    input.kind === "repo"
      ? "dépôt GitHub"
      : input.kind === "tool"
        ? "outil IA / SaaS"
        : "article / news tech";

  return [
    "Tu es un éditeur pour développeurs. Analyse le contenu scrapé et produis un résumé actionnable.",
    lang,
    "",
    "Règles strictes:",
    "- title: format court « nom — ce que c'est » (max ~12 mots après le tiret), jamais une phrase entière du README",
    "- purpose: une phrase claire sur ce que c'est",
    "- essentialPoints: 3 points max — (1) c'est quoi, (2) signal/chiffre notable si présent, (3) impact concret pour un dev",
    "- Interdit: HTML, balises, URLs longues, marketing vide, répéter le titre 3 fois",
    "- Ne pas utiliser le nombre de stars comme titre principal",
    "",
    `Type: ${kindLabel}`,
    `Nom: ${input.name}`,
    input.description ? `Description courte: ${input.description}` : "",
    input.metrics ? `Métriques connues: ${input.metrics}` : "",
    "",
    "Contenu scrapé:",
    input.sourceText.slice(0, 4200),
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Summarize scraped content with Gemini (Google AI Studio free tier preferred).
 * Returns null when no API key, budget exhausted, or call fails.
 */
export async function llmOrganizeIntel(input: {
  kind: "repo" | "tool" | "news";
  name: string;
  description?: string | null;
  metrics?: string | null;
  sourceText: string;
  locale?: AiLocale;
}): Promise<(OrganizedIntel & { model: string }) | null> {
  if (!isLlmOrganizeAvailable() || llmBudget <= 0) return null;

  const sourceText = sanitizePlainText(input.sourceText, 4500);
  if (sourceText.length < 60) return null;

  llmBudget -= 1;
  const locale = input.locale ?? "fr";
  const { model, label: modelLabel } = resolveModel();

  try {
    const { output } = await generateText({
      model,
      output: Output.object({
        schema: organizeSchema,
        name: "intel_summary",
        description: "Title, purpose, and essential dev-focused points",
      }),
      prompt: buildPrompt({
        kind: input.kind,
        name: input.name,
        description: input.description?.trim() || undefined,
        metrics: input.metrics?.trim() || undefined,
        sourceText,
        locale,
      }),
      maxOutputTokens: 600,
    });

    if (!output) return null;

    const title = sanitizePlainText(output.title, 120);
    const purpose = sanitizePlainText(output.purpose, 200);
    const essentialPoints = output.essentialPoints
      .map((p) => sanitizePlainText(p, 220))
      .filter((p) => p.length >= 12);

    if (!title || !purpose || essentialPoints.length < 2) return null;

    const longAbout = [purpose, ...essentialPoints].join("\n\n").slice(0, 1800);

    return {
      title,
      purpose,
      essentialPoints: essentialPoints.slice(0, 4),
      longAbout,
      model: modelLabel,
    };
  } catch {
    return null;
  }
}
