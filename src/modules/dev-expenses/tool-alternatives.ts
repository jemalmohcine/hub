import { truncateAtWord } from "@/lib/text";
import type { AlternativeOption, MigrationEffort } from "@/modules/dev-expenses/types";
import type { DevTool } from "@/modules/dev-tools/types";

/**
 * Bridge between the scraped catalogue and the expense advisor: a `dev_tools`
 * row becomes an alternative the diagnostic can show, with the real free plan
 * and the real entry price rather than an editorial guess.
 */

/** Self-hosting is always work; swapping one hosted API for another rarely is. */
function effortFor(tool: DevTool): MigrationEffort {
  if (tool.pricingModel === "open_source") return "high";
  if (tool.category === "ai_api" || tool.category === "email") return "low";
  if (tool.category === "database" || tool.category === "auth") return "high";
  return "medium";
}

function priceFor(tool: DevTool): number | null {
  if (tool.pricingModel === "open_source" || tool.hasFreeTier) return 0;
  return tool.startingPriceEur;
}

function prosFor(tool: DevTool): string[] {
  if (tool.pros.length) return tool.pros;
  const derived: string[] = [];
  if (tool.hasFreeTier) derived.push("Plan gratuit permanent");
  if (tool.stabilityScore >= 70) derived.push("Projet stable et activement maintenu");
  if (tool.popularityScore >= 70) derived.push("Largement adopté, donc bien documenté");
  return derived.length ? derived : ["Couvre le même besoin"];
}

function consFor(tool: DevTool): string[] {
  if (tool.cons.length) return tool.cons;
  const derived: string[] = [];
  if (tool.pricingModel === "open_source") derived.push("À héberger et maintenir toi-même");
  if (tool.stabilityScore < 50) derived.push("Projet encore jeune, API susceptible de bouger");
  return derived.length ? derived : ["Migration à valider sur ton usage réel"];
}

export function toAlternativeOption(tool: DevTool): AlternativeOption {
  return {
    name: tool.name,
    slug: tool.slug,
    typicalMonthlyEur: priceFor(tool),
    freeTier: tool.freeTierNote ?? (tool.hasFreeTier ? "Plan gratuit disponible" : null),
    pros: prosFor(tool),
    cons: consFor(tool),
    bestFor: tool.bestFor ?? tool.tagline ?? "Même usage, coût plus bas",
    migrationEffort: effortFor(tool),
    url: tool.pricingUrl ?? tool.websiteUrl,
  };
}

/** Compact form handed to the model as the set it is allowed to recommend. */
export function describeToolForPrompt(tool: DevTool): string {
  const price =
    tool.pricingModel === "open_source"
      ? "open source, auto-hébergé"
      : tool.hasFreeTier
        ? `plan gratuit${tool.startingPriceEur != null ? `, puis ${tool.startingPriceEur} €/mois` : ""}`
        : tool.startingPriceEur != null
          ? `à partir de ${tool.startingPriceEur} €/mois`
          : "tarif à l'usage";

  const facts = [
    price,
    `notoriété ${tool.popularityScore}/100`,
    `stabilité ${tool.stabilityScore}/100`,
    tool.freeTierNote ? `gratuit: ${truncateAtWord(tool.freeTierNote, 120)}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return `- ${tool.name} (${tool.slug}) — ${facts}`;
}
