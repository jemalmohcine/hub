export type DevVerdict = "use_it" | "watch" | "skip";

import { firstCleanClause, sanitizePlainText } from "@/modules/ai-intel/html-to-text";

export type ScoreResult = {
  score: number;
  verdict: DevVerdict;
  verdictLabel: string;
  takeaway: string;
  reasons: string[];
  beneficial: boolean;
};

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function logPoints(value: number, maxPoints: number, midValue: number): number {
  if (!value || value <= 0) return 0;
  return maxPoints * (1 - Math.exp(-value / midValue));
}

/** Signals that a working builder should care about. */
export const DEV_SIGNAL_RE =
  /\b(ai|llm|agent|rag|mcp|sdk|cli|ide|api|typescript|python|rust|golang|go\b|devops|infra|eval|benchmark|coding|code|developer|devtools?|framework|orchestrat|workflow|cursor|copilot|windsurf|langchain|llamaindex|vercel|next\.?js|react|node|docker|kubernetes|observability|auth|postgres|redis|vector|embedding|transformer|inference|fine[\s-]?tun)\b/i;

const NON_DEV_RE =
  /\b(marketing|seo|social media|instagram|tiktok|influencer|canva|logo|wallpaper|coloring|recipe|fitness|dating|horoscope|nft art|stock photo|voice changer|anime|waifu|essay writer for students)\b/i;

const IMPACT_RE =
  /\b(deprecat|sunset|retir|breaking|security|cve|vulnerab|outage|rate\s*limit|price\s*cut|pricing|cost increase|ban(ned)?|shutdown|removed|migration required|api change)\b/i;

function finalize(
  score: number,
  reasons: string[],
  labels: {
    use: string;
    watch: string;
    skip: string;
    useTake: string;
    watchTake: string;
    skipTake: string;
  },
  thresholds = { use: 68, watch: 46 },
): ScoreResult {
  const s = clamp(score);
  const verdict: DevVerdict =
    s >= thresholds.use ? "use_it" : s >= thresholds.watch ? "watch" : "skip";
  return {
    score: s,
    verdict,
    verdictLabel:
      verdict === "use_it"
        ? labels.use
        : verdict === "watch"
          ? labels.watch
          : labels.skip,
    takeaway:
      verdict === "use_it"
        ? labels.useTake
        : verdict === "watch"
          ? labels.watchTake
          : labels.skipTake,
    reasons: reasons.slice(0, 4),
    beneficial: verdict === "use_it",
  };
}

export function scoreGithubRepo(input: {
  stars: number;
  starsToday?: number;
  forks?: number;
  description?: string | null;
  language?: string | null;
  rank?: number | null;
  topics?: string[];
  title?: string;
}): ScoreResult {
  const stars = input.stars || 0;
  const starsToday = input.starsToday || 0;
  const forks = input.forks || 0;
  const desc = sanitizePlainText((input.description || "").trim(), 500);
  const lang = (input.language || "").toLowerCase();
  const topics = (input.topics || []).join(" ");
  const blob = `${input.title ?? ""} ${desc} ${topics} ${lang}`;
  const reasons: string[] = [];
  let score = 8;

  const hasDevSignal = DEV_SIGNAL_RE.test(blob);
  const isNonDev = NON_DEV_RE.test(blob);

  // Momentum matters only if the repo is relevant to a builder
  const todayPts = logPoints(starsToday, hasDevSignal ? 36 : 14, 350);
  score += todayPts;
  if (starsToday >= 150 && hasDevSignal) {
    reasons.push(`+${starsToday.toLocaleString("fr-FR")} stars aujourd’hui`);
  }

  score += logPoints(stars, hasDevSignal ? 22 : 10, 6000);
  if (stars >= 2000 && hasDevSignal) {
    reasons.push(`${formatStars(stars)} stars`);
  }

  score += logPoints(forks, 6, 1200);

  if (desc.length >= 24) score += 6;
  if (desc.length >= 80) score += 4;
  const descClause = firstCleanClause(desc, 90);
  if (descClause.length >= 24) reasons.push(descClause);

  if (hasDevSignal) {
    score += 22;
    reasons.push("Pertinent pour le développement et l’IA");
  } else {
    score -= 18;
    reasons.push("Peu lié au développement logiciel");
  }

  if (isNonDev) {
    score -= 25;
    reasons.push("Hors périmètre technique");
  }

  if (["typescript", "python", "rust", "go", "javascript"].includes(lang)) {
    score += 6;
    if (hasDevSignal) reasons.push(`Langage ${input.language}`);
  }

  if (input.rank != null && input.rank > 0 && hasDevSignal) {
    score += Math.max(0, 10 - (input.rank - 1) * 1.5);
    if (input.rank <= 5) reasons.push(`Top ${input.rank} trending`);
  }

  // Cap noise repos even if viral
  if (!hasDevSignal) score = Math.min(score, 44);

  return finalize(
    score,
    reasons,
    {
      use: "À essayer",
      watch: "À suivre",
      skip: "Peu pertinent",
      useTake:
        "Dépôt prometteur. Un essai sur un cas réel est recommandé.",
      watchTake:
        "Activité correcte. À suivre si le sujet correspond à vos besoins.",
      skipTake:
        "Intérêt limité pour le développement. Priorité faible.",
    },
    { use: 66, watch: 48 },
  );
}

export function scoreAiTool(input: {
  title: string;
  tagline?: string | null;
  about?: string | null;
  pricing?: string | null;
  upvotes?: number | null;
  tags?: string[];
  mattsPick?: boolean;
  openSource?: string | null;
  api?: string | null;
}): ScoreResult {
  const text = `${input.title} ${input.tagline ?? ""} ${input.about ?? ""} ${(input.tags ?? []).join(" ")}`;
  const reasons: string[] = [];
  let score = 12;

  const hasDevSignal = DEV_SIGNAL_RE.test(text);
  const isNonDev = NON_DEV_RE.test(text);

  if (input.mattsPick && hasDevSignal) {
    score += 14;
    reasons.push("Sélection éditoriale");
  }

  const upvotes = Number(input.upvotes) || 0;
  score += logPoints(upvotes, hasDevSignal ? 14 : 6, 35);

  const pricing = (input.pricing || "").toLowerCase();
  if (/free|freemium|open/.test(pricing)) {
    score += hasDevSignal ? 12 : 4;
    if (hasDevSignal) reasons.push(`Tarif: ${input.pricing}`);
  } else if (/paid|subscription/.test(pricing)) {
    score += hasDevSignal ? 4 : 0;
  }

  if (/^yes|oui|true/i.test(input.openSource || "")) {
    score += hasDevSignal ? 12 : 3;
    if (hasDevSignal) reasons.push("Open source");
  }

  if (input.api && !/not listed|none|no\b/i.test(input.api)) {
    score += hasDevSignal ? 10 : 2;
    if (hasDevSignal) reasons.push(`API: ${input.api}`);
  }

  if (/\b(mcp|cli|sdk|ide|cursor|copilot|agent|rag|devtools?)\b/i.test(text)) {
    score += 24;
    reasons.push("Utile pour le développement et les outils");
  } else if (hasDevSignal) {
    score += 14;
    reasons.push("Pertinent pour les équipes techniques");
  } else if (isNonDev) {
    score -= 22;
    reasons.push("Orienté grand public ou marketing");
  } else {
    score -= 8;
    reasons.push("Pertinence technique limitée");
  }

  if ((input.about || "").length > 120 && hasDevSignal) score += 4;

  if (!hasDevSignal) score = Math.min(score, 42);

  return finalize(
    score,
    reasons,
    {
      use: "Recommandé",
      watch: "À évaluer",
      skip: "Peu utile",
      useTake:
        "Peut améliorer votre productivité. Un essai sur un cas concret est recommandé.",
      watchTake:
        "Intéressant, sans urgence. Comparez-le à vos outils actuels.",
      skipTake: "Valeur limitée sauf besoin métier précis.",
    },
    { use: 64, watch: 46 },
  );
}

export function scoreGenericNews(input: {
  title: string;
  summary?: string;
  urgency?: string;
}): ScoreResult {
  const text = `${input.title} ${input.summary ?? ""}`;
  const reasons: string[] = [];
  let score = 18;

  if (IMPACT_RE.test(text)) {
    score += 42;
    reasons.push("Impact possible sur outils, coûts ou production");
  } else if (
    /\b(launch|release|new model|gpt|claude|gemini|sdk|api|mcp)\b/i.test(text)
  ) {
    score += DEV_SIGNAL_RE.test(text) ? 24 : 10;
    reasons.push(
      DEV_SIGNAL_RE.test(text)
        ? "Nouvelle offre produit ou modèle"
        : "Nouveauté à faible signal",
    );
  } else if (
    /\b(regulat|policy|government|election|trump|china|geopolit|court)\b/i.test(
      text,
    )
  ) {
    score -= 6;
    reasons.push("Contexte général, peu actionnable immédiatement");
  } else {
    score += 4;
  }

  if (DEV_SIGNAL_RE.test(text)) score += 10;
  if (NON_DEV_RE.test(text)) score -= 20;

  if (input.urgency === "urgent") score += 12;
  if (input.urgency === "medium") score += 4;

  return finalize(
    score,
    reasons,
    {
      use: "À traiter",
      watch: "À parcourir",
      skip: "Secondaire",
      useTake:
        "Peut affecter vos outils, coûts ou environnements. À examiner rapidement.",
      watchTake:
        "Utile à connaître. Agissez seulement si cela vous concerne.",
      skipTake: "Contexte général. Priorité faible.",
    },
    { use: 68, watch: 48 },
  );
}

/** Clearly outside a developer's scope, whatever the LLM thinks. */
export function isOffTopic(text: string): boolean {
  return NON_DEV_RE.test(text) && !DEV_SIGNAL_RE.test(text);
}

export function verdictFromScore(score: number): DevVerdict {
  if (score >= 68) return "use_it";
  if (score >= 46) return "watch";
  return "skip";
}

export function formatStars(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return String(n);
}

export function attachScoreToRaw(
  kind: "repo" | "tool" | "news",
  raw: Record<string, unknown>,
  extras: {
    title: string;
    summary?: string;
    urgency?: string;
  },
): Record<string, unknown> {
  const scored =
    kind === "repo"
      ? scoreGithubRepo({
          title: extras.title,
          stars: Number(raw.stars) || 0,
          starsToday: Number(raw.starsToday) || 0,
          forks: Number(raw.forks) || 0,
          description: (raw.description as string) || extras.summary,
          language: (raw.language as string) || null,
          rank: raw.rank != null ? Number(raw.rank) : null,
          topics: Array.isArray(raw.topics) ? (raw.topics as string[]) : [],
        })
      : kind === "tool"
        ? scoreAiTool({
            title: extras.title,
            tagline: (raw.tagline as string) || null,
            about: (raw.about as string) || null,
            pricing: (raw.pricing as string) || null,
            upvotes: raw.upvotes != null ? Number(raw.upvotes) : null,
            tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
            mattsPick: raw.mattsPick === true,
            openSource: (raw.openSource as string) || null,
            api: (raw.api as string) || null,
          })
        : scoreGenericNews({
            title: extras.title,
            summary: extras.summary,
            urgency: extras.urgency,
          });

  return {
    ...raw,
    score: scored.score,
    verdict: scored.verdict,
    verdictLabel: scored.verdictLabel,
    takeaway: scored.takeaway,
    takeawayFr: scored.takeaway,
    // English twin filled at enrich / brief cleanTakeaway
    scoreReasons: scored.reasons,
    beneficial: scored.beneficial,
  };
}

/** Keep only items worth a developer's time (or multi-confirmed). */
export function isWorthKeeping(meta: Record<string, unknown>, confirmations = 1): boolean {
  // Security, pricing and deprecation always survive the filter.
  if (meta.hardSignal || meta.actionRequired === true) return true;

  const score = Number(meta.score) || 0;
  const verdict = meta.verdict;
  if (verdict === "use_it") return true;
  if (verdict === "watch" && score >= 44) return true;
  if (confirmations >= 2 && score >= 36) return true;
  // Drop clear noise
  if (verdict === "skip" && score < 36) return false;
  return score >= 38;
}
