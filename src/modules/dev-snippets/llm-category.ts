import { generateText, Output } from "ai";
import { z } from "zod";
import { isLlmAvailable, isRateLimitError, resolveLlmModel, sleep } from "@/lib/ai/model";
import { truncateAtWord } from "@/lib/text";
import {
  classifyCategoryLocal,
  matchExistingCategory,
  normalizeCategoryName,
  type CategoryHint,
} from "@/modules/dev-snippets/classify-category";

const RATE_LIMIT_RETRY_MS = 8_000;

const resultSchema = z.object({
  category: z
    .string()
    .min(1)
    .max(40)
    .describe(
      "Short category label, 1–3 words. Reuse an existing name when it fits.",
    ),
});

function model() {
  return resolveLlmModel(process.env.SNIPPETS_LLM_MODEL || process.env.AI_INTEL_LLM_MODEL);
}

/**
 * Optional: name the snippet from its content. Returns null when the key is
 * missing or the free tier throttles — callers use classifyCategoryLocal.
 */
export async function classifyCategoryWithLlm(
  hint: CategoryHint,
  existing: string[],
): Promise<string | null> {
  if (!isLlmAvailable()) return null;

  const excerpt = truncateAtWord(hint.content.replace(/\s+/g, " "), 240);
  const { model: resolved } = model();
  const prompt = [
    "Tu ranges un snippet / une note de développeur dans UNE catégorie.",
    "Réponds avec un libellé court (1 à 3 mots), du type Docker, PostgreSQL, React, Git.",
    "Pas de libellé générique : Code, Snippet, Note, Divers, Other.",
    "Si une catégorie existante convient, reprends-la EXACTEMENT (même orthographe).",
    existing.length > 0
      ? `Catégories déjà utilisées: ${existing.slice(0, 40).join(", ")}`
      : "Aucune catégorie existante.",
    `Titre: ${hint.title.trim() || "-"}`,
    `Langage: ${hint.language?.trim() || "-"}`,
    `Tags: ${hint.tags.length > 0 ? hint.tags.join(", ") : "-"}`,
    `Extrait: ${excerpt || "-"}`,
  ].join("\n");

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const { output } = await generateText({
        model: resolved,
        output: Output.object({ schema: resultSchema, name: "snippetCategory" }),
        prompt,
        maxOutputTokens: 80,
      });
      const proposed = normalizeCategoryName(output?.category ?? "");
      if (!proposed) return null;
      if (/^(code|snippet|note|notes?|divers|other|misc)$/i.test(proposed)) {
        return null;
      }
      return matchExistingCategory(proposed, existing) ?? proposed;
    } catch (err) {
      if (attempt > 0 || !isRateLimitError(err)) return null;
      await sleep(RATE_LIMIT_RETRY_MS);
    }
  }

  return null;
}

/** LLM first, local catalog if it returns nothing. */
export async function resolveSnippetCategory(
  hint: CategoryHint,
  existing: string[],
): Promise<string> {
  const fromLlm = await classifyCategoryWithLlm(hint, existing);
  return fromLlm ?? classifyCategoryLocal(hint, existing);
}
