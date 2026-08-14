import { generateText, Output } from "ai";
import { z } from "zod";
import { isLlmAvailable, isRateLimitError, resolveLlmModel, sleep } from "@/lib/ai/model";
import { truncateAtWord } from "@/lib/text";
import type { SnippetSearchItem } from "@/modules/dev-snippets/match";

const RATE_LIMIT_RETRY_MS = 8_000;
const MAX_CATALOG = 48;

const resultSchema = z.object({
  ids: z
    .array(z.string().min(1).max(80))
    .max(24)
    .describe("Ids of matching snippets, best first. Empty if nothing matches."),
});

function model() {
  return resolveLlmModel(process.env.SNIPPETS_LLM_MODEL || process.env.AI_INTEL_LLM_MODEL);
}

function catalogLine(item: SnippetSearchItem): string {
  const excerpt = truncateAtWord(item.content.replace(/\s+/g, " "), 160);
  const tags = item.tags.length > 0 ? item.tags.join(",") : "-";
  return [
    item.id,
    item.kind,
    item.language || "-",
    item.categoryName || "-",
    item.title,
    tags,
    excerpt,
  ].join(" | ");
}

/**
 * Optional: rank the user's library by intent. Returns null when the key is
 * missing, the free tier throttles, or the payload is unusable — callers keep
 * the local match list.
 */
export async function rankSnippetsWithLlm(
  query: string,
  items: SnippetSearchItem[],
): Promise<string[] | null> {
  if (!isLlmAvailable() || items.length === 0) return null;

  const catalog = items.slice(0, MAX_CATALOG).map(catalogLine).join("\n");
  const { model: resolved } = model();
  const prompt = [
    "Tu ranges la bibliothèque de snippets / notes d'un développeur.",
    "La requête peut être un mot (docker), un langage (javascript), ou une intention (healthcheck postgres).",
    "Retourne uniquement les ids qui correspondent vraiment, du plus pertinent au moins pertinent.",
    "Lis le titre, la catégorie (générée d'après le contenu), les tags, le langage et l'extrait. N'invente aucun id.",
    `Requête: ${query.trim()}`,
    "Catalogue (id | kind | language | category | title | tags | excerpt):",
    catalog,
  ].join("\n");

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const { output } = await generateText({
        model: resolved,
        output: Output.object({ schema: resultSchema, name: "snippetSearch" }),
        prompt,
        maxOutputTokens: 400,
      });
      const ids = output?.ids ?? [];
      const known = new Set(items.map((item) => item.id));
      const filtered = ids.filter((id) => known.has(id));
      return filtered.length > 0 ? filtered : null;
    } catch (err) {
      if (attempt > 0 || !isRateLimitError(err)) return null;
      await sleep(RATE_LIMIT_RETRY_MS);
    }
  }

  return null;
}
