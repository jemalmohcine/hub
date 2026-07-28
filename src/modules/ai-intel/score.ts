export type DevVerdict = "use_it" | "watch" | "skip";

export type ScoreResult = {
  score: number;
  verdict: DevVerdict;
  verdictLabel: string;
  takeaway: string;
  reasons: string[];
};

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function logPoints(value: number, maxPoints: number, midValue: number): number {
  if (!value || value <= 0) return 0;
  // ~half points at midValue, approaches maxPoints asymptotically
  return maxPoints * (1 - Math.exp(-value / midValue));
}

const DEV_SIGNAL_RE =
  /\b(ai|llm|agent|rag|mcp|sdk|cli|ide|typescript|python|rust|golang|devops|infra|eval|benchmark|coding|developer|framework|orchestrat|workflow|cursor|copilot)\b/i;

export function scoreGithubRepo(input: {
  stars: number;
  starsToday?: number;
  forks?: number;
  description?: string | null;
  language?: string | null;
  rank?: number | null;
  topics?: string[];
}): ScoreResult {
  const stars = input.stars || 0;
  const starsToday = input.starsToday || 0;
  const forks = input.forks || 0;
  const desc = (input.description || "").trim();
  const lang = (input.language || "").toLowerCase();
  const topics = (input.topics || []).join(" ");
  const blob = `${desc} ${topics} ${lang}`;

  const reasons: string[] = [];
  let score = 0;

  const todayPts = logPoints(starsToday, 40, 400);
  score += todayPts;
  if (starsToday >= 200) reasons.push(`+${starsToday.toLocaleString("fr-FR")} stars aujourd'hui`);

  const starsPts = logPoints(stars, 25, 8000);
  score += starsPts;
  if (stars >= 1000) reasons.push(`${formatStars(stars)} stars au total`);

  const forkPts = logPoints(forks, 8, 1500);
  score += forkPts;

  let descPts = 0;
  if (desc.length >= 20) descPts += 8;
  if (desc.length >= 60) descPts += 4;
  if (DEV_SIGNAL_RE.test(blob)) descPts += 8;
  score += descPts;
  if (desc) reasons.push(desc.length > 90 ? `${desc.slice(0, 87)}…` : desc);

  if (["typescript", "python", "rust", "go", "javascript"].includes(lang)) {
    score += 5;
    reasons.push(`Langage ${input.language}`);
  }

  if (input.rank != null && input.rank > 0) {
    const rankPts = Math.max(0, 12 - (input.rank - 1));
    score += rankPts;
    if (input.rank <= 5) reasons.push(`Top ${input.rank} trending`);
  }

  score = clamp(score);
  const verdict: DevVerdict =
    score >= 72 ? "use_it" : score >= 48 ? "watch" : "skip";

  const verdictLabel =
    verdict === "use_it"
      ? "À tester"
      : verdict === "watch"
        ? "Surveiller"
        : "Pas prioritaire";

  const takeaway =
    verdict === "use_it"
      ? `Repo chaud (${formatStars(stars)}${starsToday ? `, +${formatStars(starsToday)}/j` : ""}). Worth a look si ça touche ton stack.`
      : verdict === "watch"
        ? `Momentum moyen. Garde-le en watchlist si le sujet te concerne.`
        : `Bruit relatif. Skip sauf besoin très précis.`;

  return { score, verdict, verdictLabel, takeaway, reasons: reasons.slice(0, 4) };
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
  let score = 18; // baseline for curated tools

  if (input.mattsPick) {
    score += 22;
    reasons.push("Matt's Pick");
  }

  const upvotes = Number(input.upvotes) || 0;
  score += logPoints(upvotes, 18, 40);
  if (upvotes >= 20) reasons.push(`${upvotes} upvotes`);

  const pricing = (input.pricing || "").toLowerCase();
  if (/free|freemium|open/.test(pricing)) {
    score += 14;
    reasons.push(`Prix: ${input.pricing}`);
  } else if (/paid|subscription/.test(pricing)) {
    score += 6;
    reasons.push(`Prix: ${input.pricing}`);
  }

  if (/^yes|oui|true/i.test(input.openSource || "")) {
    score += 10;
    reasons.push("Open source");
  }

  if (input.api && !/not listed|none|no\b/i.test(input.api)) {
    score += 8;
    reasons.push(`API: ${input.api}`);
  }

  let fit = 0;
  if (/\b(ide|cursor|copilot|coding|code|sdk|cli|mcp|agent|rag|developer|devtools?|api|typescript|python)\b/i.test(text)) {
    fit += 16;
    reasons.push("Utile côté DX / coding");
  } else if (/\b(design|image|video|music|marketing|seo|social)\b/i.test(text)) {
    fit += 4;
    reasons.push("Moins central pour un flow de code");
  } else {
    fit += 8;
  }
  score += fit;

  if ((input.about || "").length > 120) score += 6;

  score = clamp(score);
  const verdict: DevVerdict =
    score >= 70 ? "use_it" : score >= 45 ? "watch" : "skip";

  const verdictLabel =
    verdict === "use_it"
      ? "Utile pour un dev"
      : verdict === "watch"
        ? "À évaluer"
        : "Peu prioritaire";

  const takeaway =
    verdict === "use_it"
      ? "Bon signal pour un workflow de build. Teste sur un cas concret cette semaine."
      : verdict === "watch"
        ? "Intéressant mais pas urgent. Compare à ce que tu utilises déjà."
        : "Faible fit DX. Ignore sauf besoin métier très précis.";

  return { score, verdict, verdictLabel, takeaway, reasons: reasons.slice(0, 4) };
}

export function scoreGenericNews(input: {
  title: string;
  summary?: string;
  urgency?: string;
}): ScoreResult {
  const text = `${input.title} ${input.summary ?? ""}`;
  let score = 30;
  const reasons: string[] = [];

  if (/\b(deprecat|breaking|ban|security|pricing|price cut|rate limit)\b/i.test(text)) {
    score += 35;
    reasons.push("Impact possible en prod");
  } else if (/\b(launch|release|new model|upgrade|sdk|api)\b/i.test(text)) {
    score += 20;
    reasons.push("Nouveauté produit / modèle");
  } else {
    score += 8;
  }

  if (input.urgency === "urgent") score += 20;
  if (input.urgency === "medium") score += 10;

  score = clamp(score);
  const verdict: DevVerdict =
    score >= 70 ? "use_it" : score >= 45 ? "watch" : "skip";
  const verdictLabel =
    verdict === "use_it"
      ? "À traiter"
      : verdict === "watch"
        ? "À lire vite"
        : "Bruit";
  const takeaway =
    verdict === "use_it"
      ? "Peut changer ton stack ou tes coûts. Lis et décide aujourd'hui."
      : verdict === "watch"
        ? "Bon à savoir. Pas besoin d'agir tout de suite."
        : "Contexte seulement. Skip si tu es focus.";

  return { score, verdict, verdictLabel, takeaway, reasons: reasons.slice(0, 3) };
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
    scoreReasons: scored.reasons,
  };
}
