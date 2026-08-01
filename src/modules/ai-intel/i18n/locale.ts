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
    tabAll: "Tout",
    tabUrgent: "Urgent",
    tabGithub: "GitHub",
    tabTools: "Outils",
    tabNews: "Actus",
    sectionUrgentDesc: "Repos en explosion, prix, modèles, breaking",
    sectionGithubDesc: "Trending, releases, repos à surveiller",
    sectionToolsDesc: "Nouveaux outils et mises à jour produit",
    sectionNewsDesc: "Annonces, recherche, communauté",
    viewAll: "Voir tout",
    tabSaved: "Favoris",
    urgent: "Urgent",
    free: "Gratuit",
    freemium: "Freemium",
    paid: "Payant",
    trending: "Tendance",
    stars: "stars",
    starsToday: "/j",
    typeRepo: "GitHub",
    typeTool: "Outil",
    typeNews: "Actu",
    unread: "Non lu",
    read: "Lu",
    search: "Rechercher…",
    empty: "Rien d’urgent pour cette période",
    emptyHint: "Consultez GitHub, Outils ou Actus.",
    noData: "Aucun contenu",
    emptyUrgent: "Aucune alerte urgente",
    emptyUrgentHint:
      "Changements qui demandent une action: prix, breaking, dépréciation.",
    tldr: "Résumé",
    recapTitle: "L’essentiel en 3 points",
    why: "Points clés",
    action: "Action",
    facts: "Informations",
    sources: "Source",
    visit: "Ouvrir",
    visitSite: "Visiter le site",
    visitSource: "Voir la source",
    save: "Enregistrer",
    savedBtn: "Enregistré",
    translated: "Traduit",
    original: "Original",
    published: "Publié",
    added: "Ajouté",
    score: "Score",
    pageTitle: "Intelligence AI",
    pageDesc:
      "Le filtre de période et la date affichée correspondent au jour où l’info a été scrapée.",
    digestPrefix: "Dernière mise à jour",
    digestEmpty: "Aucune mise à jour pour le moment",
    detail: "En savoir plus",
    unknownDate: "Date indisponible",
    langFr: "FR",
    langEn: "EN",
  },
  en: {
    tabAll: "All",
    tabUrgent: "Urgent",
    tabGithub: "GitHub",
    tabTools: "Tools",
    tabNews: "News",
    sectionUrgentDesc: "Exploding repos, pricing, models, breaking",
    sectionGithubDesc: "Trending, releases, repos to watch",
    sectionToolsDesc: "New tools and product updates",
    sectionNewsDesc: "Announcements, research, community",
    viewAll: "View all",
    tabSaved: "Saved",
    urgent: "Urgent",
    free: "Free",
    freemium: "Freemium",
    paid: "Paid",
    trending: "Trending",
    stars: "stars",
    starsToday: "/day",
    typeRepo: "GitHub",
    typeTool: "Tool",
    typeNews: "News",
    unread: "Unread",
    read: "Read",
    search: "Search…",
    empty: "Nothing urgent for this period",
    emptyHint: "Browse GitHub, Tools, or News.",
    noData: "No content",
    emptyUrgent: "No urgent alerts",
    emptyUrgentHint:
      "Action-required changes only: pricing, breaking updates, deprecations.",
    tldr: "Summary",
    recapTitle: "Essentials in 3 points",
    why: "Key points",
    action: "Action",
    facts: "Details",
    sources: "Source",
    visit: "Open",
    visitSite: "Visit website",
    visitSource: "View source",
    save: "Save",
    savedBtn: "Saved",
    translated: "Translated",
    original: "Original",
    published: "Published",
    added: "Added",
    score: "Score",
    pageTitle: "AI Intelligence",
    pageDesc:
      "The date filter and card date both use the day the item was first scraped into the hub.",
    digestPrefix: "Last update",
    digestEmpty: "No update yet",
    detail: "More details",
    unknownDate: "Date unavailable",
    langFr: "FR",
    langEn: "EN",
  },
} as const;

export type UiCopy = (typeof UI)[AiLocale];

export function t(locale: AiLocale): UiCopy {
  return UI[locale];
}
