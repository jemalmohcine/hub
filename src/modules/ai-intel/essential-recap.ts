import {
  detectContentKind,
  productOf,
} from "@/modules/ai-intel/content-kind";
import {
  explainTitle,
  getItemI18n,
  readMeta,
  resolveBrief,
} from "@/modules/ai-intel/brief";
import type { AiLocale } from "@/modules/ai-intel/i18n/locale";
import { formatStars } from "@/modules/ai-intel/score";
import type { AiIntelItem } from "@/modules/ai-intel/types";

export type EssentialPoint = {
  id: string;
  label: string;
  teaser: string;
  detail: string;
};

function pickLocalized(
  bag: { en?: string; fr?: string } | undefined,
  locale: AiLocale,
  fallback: string,
): string {
  if (!bag) return fallback;
  return (bag[locale] || bag.fr || bag.en || fallback).trim();
}

/** Three factual bullets — enough to understand without opening the source. */
export function buildEssentialRecap(
  item: Pick<
    AiIntelItem,
    | "title"
    | "summary"
    | "urgency"
    | "metadata"
    | "pillar"
    | "category"
    | "primary_source"
    | "url"
    | "published_at"
    | "ingested_at"
  >,
  locale: AiLocale,
): EssentialPoint[] {
  const meta = (item.metadata ?? {}) as Record<string, unknown>;
  const i18n = getItemI18n(meta);
  const brief = resolveBrief(item, locale);
  const kind = detectContentKind(item);
  const about =
    pickLocalized(i18n?.about, locale, "") ||
    readMeta(meta, "about") ||
    readMeta(meta, "description") ||
    "";

  const L =
    locale === "fr"
      ? {
          what: "C’est quoi",
          signal: "Chiffres clés",
          impact: "Impact dev",
          repoMomentum: "Momentum GitHub",
          priceChange: "Changement tarifaire",
          modelRelease: "Nouveau modèle",
          breakingChange: "Changement majeur",
          securityIssue: "Sécurité",
          source: "Source",
        }
      : {
          what: "What it is",
          signal: "Key numbers",
          impact: "Dev impact",
          repoMomentum: "GitHub momentum",
          priceChange: "Pricing change",
          modelRelease: "New model",
          breakingChange: "Breaking change",
          securityIssue: "Security",
          source: "Source",
        };

  const stars = Number(meta.stars) || 0;
  const starsToday = Number(meta.starsToday) || 0;
  const forks = Number(meta.forks) || 0;
  const language = readMeta(meta, "language");
  const pricing = readMeta(meta, "pricing");

  const signalLines: string[] = [];
  if (stars) signalLines.push(`${formatStars(stars)}★`);
  if (starsToday) {
    signalLines.push(
      locale === "fr"
        ? `+${formatStars(starsToday)} aujourd’hui`
        : `+${formatStars(starsToday)} today`,
    );
  }
  if (forks) {
    signalLines.push(
      locale === "fr"
        ? `${formatStars(forks)} forks`
        : `${formatStars(forks)} forks`,
    );
  }
  if (language) signalLines.push(language);
  if (pricing) signalLines.push(pricing);
  if (readMeta(meta, "upvotes")) {
    signalLines.push(
      locale === "fr"
        ? `${readMeta(meta, "upvotes")} votes`
        : `${readMeta(meta, "upvotes")} upvotes`,
    );
  }
  if (readMeta(meta, "api")) signalLines.push(`API: ${readMeta(meta, "api")}`);

  const factGrid = brief.facts
    .filter((f) => !["Type", "Source", "Produit", "Product"].includes(f.label))
    .map((f) => `${f.label}: ${f.value}`)
    .join("\n");

  let signalLabel = L.signal;
  if (kind === "repo") signalLabel = L.repoMomentum;
  if (kind === "pricing") signalLabel = L.priceChange;
  if (kind === "model") signalLabel = L.modelRelease;
  if (kind === "breaking") signalLabel = L.breakingChange;
  if (kind === "security") signalLabel = L.securityIssue;

  const whatTeaser = brief.tldr || brief.title;
  const whatDetail = [brief.title, brief.tldr, about]
    .filter(Boolean)
    .filter((line, idx, arr) => arr.indexOf(line) === idx)
    .join("\n\n")
    .slice(0, 900);

  const signalTeaser =
    signalLines.slice(0, 3).join(" · ") ||
    factGrid.split("\n").slice(0, 2).join(" · ") ||
    brief.typeLabel;
  const signalDetail = [signalLines.join(" · "), factGrid]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 700);

  const impactLines = brief.why.slice(0, 3);
  if (impactLines.length === 0 && kind === "repo" && starsToday >= 200) {
    impactLines.push(
      locale === "fr"
        ? "Forte accélération — à tester sur un cas réel avant adoption en prod."
        : "Sharp acceleration — worth a quick spike on a real use case before prod.",
    );
  }
  if (impactLines.length === 0 && kind === "pricing") {
    impactLines.push(
      locale === "fr"
        ? "Vérifie ton plan actuel et le coût estimé de tes workloads."
        : "Check your current plan and estimated workload cost.",
    );
  }
  if (impactLines.length === 0 && kind === "model") {
    impactLines.push(
      locale === "fr"
        ? "Peut changer qualité, latence et coût de tes appels API."
        : "May change quality, latency, and API cost for your apps.",
    );
  }
  if (impactLines.length === 0 && kind === "breaking") {
    impactLines.push(
      locale === "fr"
        ? "Migration ou changement de config possiblement requis."
        : "You may need a migration or config change.",
    );
  }
  if (impactLines.length === 0) {
    impactLines.push(
      locale === "fr"
        ? "À surveiller si tu utilises l’écosystème concerné."
        : "Watch if you rely on the affected ecosystem.",
    );
  }

  const impactTeaser = impactLines[0] ?? "";
  const impactDetail = impactLines.join("\n\n").slice(0, 700);

  return [
    {
      id: "what",
      label: L.what,
      teaser: whatTeaser.slice(0, 120),
      detail: whatDetail,
    },
    {
      id: "signal",
      label: signalLabel,
      teaser: signalTeaser.slice(0, 120),
      detail: signalDetail || signalTeaser,
    },
    {
      id: "impact",
      label: L.impact,
      teaser: impactTeaser.slice(0, 120),
      detail: impactDetail,
    },
  ];
}

/** Push / notification title — direct subject, never a count. */
export function pushAlertTitle(
  item: {
    title: string;
    summary: string;
    urgency: string;
    category: string;
    pillar: string;
    metadata: Record<string, unknown>;
    primary_source?: string;
    primarySource?: string;
  },
  locale: AiLocale = "fr",
): string {
  const normalized = {
    title: item.title,
    summary: item.summary,
    urgency: item.urgency as AiIntelItem["urgency"],
    metadata: item.metadata,
    pillar: item.pillar as AiIntelItem["pillar"],
    category: item.category,
    primary_source: item.primary_source ?? item.primarySource ?? "",
  };
  const meta = (item.metadata ?? {}) as Record<string, unknown>;
  const kind = detectContentKind(normalized);
  const explained = explainTitle(normalized, locale);
  const product = productOf(normalized);
  const starsToday = Number(meta.starsToday) || 0;
  const short = explained.name.includes("/")
    ? explained.name.split("/").pop() || explained.name
    : explained.name;

  if (kind === "repo" && starsToday >= 200) {
    return locale === "fr"
      ? `${short}: +${formatStars(starsToday)} stars en 24h`
      : `${short}: +${formatStars(starsToday)} stars in 24h`;
  }
  if (kind === "pricing") {
    return product
      ? locale === "fr"
        ? `${product} — changement de prix`
        : `${product} — pricing change`
      : explained.title;
  }
  if (kind === "model") {
    return product
      ? locale === "fr"
        ? `${product} — nouveau modèle`
        : `${product} — new model`
      : explained.title;
  }
  if (kind === "breaking") {
    return product
      ? locale === "fr"
        ? `${product} — changement majeur`
        : `${product} — breaking change`
      : explained.title;
  }
  if (kind === "security") {
    return product
      ? locale === "fr"
        ? `${product} — alerte sécurité`
        : `${product} — security alert`
      : explained.title;
  }

  return explained.title;
}
