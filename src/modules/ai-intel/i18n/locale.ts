export type AiLocale = "fr" | "en";
export type LocalePreference = "auto" | AiLocale;

export function normalizeLocale(value: string | null | undefined): AiLocale {
  if (!value) return "fr";
  const v = value.toLowerCase();
  if (v.startsWith("en")) return "en";
  if (v === "auto") return "fr";
  return "fr";
}

export function normalizeLocalePreference(
  value: string | null | undefined,
): LocalePreference {
  if (!value) return "auto";
  const v = value.toLowerCase();
  if (v === "auto") return "auto";
  if (v.startsWith("en")) return "en";
  if (v.startsWith("fr")) return "fr";
  return "auto";
}

/** Resolve effective UI locale: settings override, else browser / Accept-Language. */
export function resolveLocale(
  preference: string | null | undefined,
  browserLanguage: string | null | undefined,
): AiLocale {
  const pref = normalizeLocalePreference(preference);
  if (pref === "fr" || pref === "en") return pref;

  const hints = (browserLanguage || "")
    .split(",")
    .map((part) => part.trim().toLowerCase().split(";")[0]);

  for (const hint of hints) {
    if (hint.startsWith("en")) return "en";
    if (hint.startsWith("fr")) return "fr";
  }
  return "fr";
}

export const UI = {
  fr: {
    essential: "Aujourd’hui",
    repos: "Repos",
    tools: "Outils",
    models: "Models",
    world: "Monde",
    saved: "Sauvé",
    impact: "Urgent",
    useful: "Utile",
    secondary: "Plus tard",
    sectionImpact: "À traiter maintenant",
    sectionRepos: "Repos à explorer",
    sectionUseful: "À garder en tête",
    search: "Chercher…",
    empty: "Rien d’important aujourd’hui",
    emptyHint: "Change la date, ou regarde Repos / Outils.",
    noData: "Aucune info",
    tldr: "En bref",
    why: "Pourquoi ça compte",
    action: "Que faire",
    facts: "Infos clés",
    sources: "Source",
    visit: "Ouvrir",
    visitSite: "Visiter le site",
    save: "Sauver",
    translated: "Traduit",
    original: "Original",
    published: "Publié",
    added: "Ajouté",
    score: "Score",
    pageTitle: "AI",
    pageDesc: "Lis le titre. Tu comprends. Touche pour le brief.",
    langFr: "FR",
    langEn: "EN",
  },
  en: {
    essential: "Today",
    repos: "Repos",
    tools: "Tools",
    models: "Models",
    world: "World",
    saved: "Saved",
    impact: "Urgent",
    useful: "Useful",
    secondary: "Later",
    sectionImpact: "Handle now",
    sectionRepos: "Repos to explore",
    sectionUseful: "Keep in mind",
    search: "Search…",
    empty: "Nothing important today",
    emptyHint: "Change the date, or browse Repos / Tools.",
    noData: "No data",
    tldr: "TL;DR",
    why: "Why it matters",
    action: "What to do",
    facts: "Key facts",
    sources: "Source",
    visit: "Open",
    visitSite: "Visit site",
    save: "Save",
    translated: "Translated",
    original: "Original",
    published: "Published",
    added: "Added",
    score: "Score",
    pageTitle: "AI",
    pageDesc: "Read the title. You get it. Tap for the brief.",
    langFr: "FR",
    langEn: "EN",
  },
} as const;

export type UiCopy = (typeof UI)[AiLocale];

export function t(locale: AiLocale): UiCopy {
  return UI[locale];
}
