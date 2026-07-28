import { detectTextLang } from "@/modules/ai-intel/i18n/detect-lang";
import type { AiLocale } from "@/modules/ai-intel/i18n/locale";
import { translateOnce } from "@/modules/ai-intel/i18n/translate";
import { formatStars } from "@/modules/ai-intel/score";
import type { AiIntelItem, ClassifiedItem } from "@/modules/ai-intel/types";

export type LocalizedBrief = {
  /** Human title that explains what it is */
  title: string;
  /** Raw source name (repo path, tool name, …) */
  name: string;
  /** Repo | Outil | Alerte | … */
  typeLabel: string;
  tldr: string;
  why: string[];
  action: string;
  facts: Array<{ label: string; value: string }>;
};

export type ItemI18n = {
  sourceLang: "en" | "fr" | "unknown";
  translatedAt?: string;
  title: { en?: string; fr?: string };
  summary: { en?: string; fr?: string };
  takeaway: { en?: string; fr?: string };
  about: { en?: string; fr?: string };
  verdictLabel: { en?: string; fr?: string };
  reasons: { en?: string[]; fr?: string[] };
};

function readMeta(meta: Record<string, unknown>, key: string): string | null {
  const v = meta[key];
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function pickLocalized(
  bag: { en?: string; fr?: string } | undefined,
  locale: AiLocale,
  fallback: string,
): string {
  if (!bag) return fallback;
  return (bag[locale] || bag.fr || bag.en || fallback).trim();
}

const VERDICT = {
  fr: {
    use_it_repo: "À tester",
    watch_repo: "Watchlist",
    skip_repo: "Pas pour toi",
    use_it_tool: "Bénéfique",
    watch_tool: "À évaluer",
    skip_tool: "Peu utile",
    use_it_news: "À traiter",
    watch_news: "À lire vite",
    skip_news: "Bruit",
  },
  en: {
    use_it_repo: "Try it",
    watch_repo: "Watchlist",
    skip_repo: "Skip",
    use_it_tool: "Worth it",
    watch_tool: "Evaluate",
    skip_tool: "Low value",
    use_it_news: "Act on it",
    watch_news: "Skim",
    skip_news: "Noise",
  },
} as const;

const ACTION = {
  fr: {
    use_it: "Teste-le sur un vrai cas cette semaine.",
    watch: "Mets de côté. Reviens seulement si ça touche ton stack.",
    skip: "Ignore et reste focus.",
  },
  en: {
    use_it: "Test it on a real task this week.",
    watch: "Park it. Revisit only if it touches your stack.",
    skip: "Ignore and stay focused.",
  },
} as const;

function itemKind(meta: Record<string, unknown>): "repo" | "tool" | "news" {
  if (meta.kind === "repo") return "repo";
  if (meta.kind === "tool") return "tool";
  return "news";
}

function verdictKey(verdict: string): "use_it" | "watch" | "skip" {
  if (verdict === "use_it" || verdict === "watch" || verdict === "skip") {
    return verdict;
  }
  return "watch";
}

/** Pure FR or pure EN takeaway — never mixed. */
export function cleanTakeaway(
  meta: Record<string, unknown>,
  locale: AiLocale,
): string {
  const kind = itemKind(meta);
  const verdict = verdictKey(String(meta.verdict ?? "watch"));
  const stars = Number(meta.stars) || 0;
  const starsToday = Number(meta.starsToday) || 0;

  if (kind === "repo") {
    const momentum =
      stars || starsToday
        ? locale === "fr"
          ? ` (${formatStars(stars)}${starsToday ? `, +${formatStars(starsToday)}/j` : ""})`
          : ` (${formatStars(stars)}${starsToday ? `, +${formatStars(starsToday)}/day` : ""})`
        : "";
    if (locale === "fr") {
      if (verdict === "use_it")
        return `Repo utile${momentum}. Clone-le et teste sur un cas réel cette semaine.`;
      if (verdict === "watch")
        return `Momentum moyen${momentum}. Garde-le si le sujet touche déjà ton stack.`;
      return `Peu de bénéfice pour un flow de code${momentum}. Ignore et gagne du temps.`;
    }
    if (verdict === "use_it")
      return `Useful repo${momentum}. Clone it and try on a real case this week.`;
    if (verdict === "watch")
      return `Average momentum${momentum}. Keep only if it already touches your stack.`;
    return `Low value for a coding workflow${momentum}. Skip and save time.`;
  }

  if (kind === "tool") {
    if (locale === "fr") {
      if (verdict === "use_it")
        return "Ça peut te faire gagner du temps. Teste sur un vrai ticket cette semaine.";
      if (verdict === "watch")
        return "Intéressant, pas prioritaire. Compare à ce que tu utilises déjà.";
      return "Faible ROI pour un builder. Skip sauf besoin métier précis.";
    }
    if (verdict === "use_it")
      return "This can save you time. Try it on a real ticket this week.";
    if (verdict === "watch")
      return "Interesting, not urgent. Compare with what you already use.";
    return "Low ROI for a builder. Skip unless you have a precise need.";
  }

  if (locale === "fr") {
    if (verdict === "use_it")
      return "Peut changer ton stack, tes coûts ou ta prod. Lis et décide aujourd’hui.";
    if (verdict === "watch")
      return "Bon à savoir. Agis seulement si ça touche ton setup.";
    return "Contexte seulement. Skip si tu es focus.";
  }
  if (verdict === "use_it")
    return "May change your stack, costs, or prod. Read and decide today.";
  if (verdict === "watch")
    return "Good to know. Act only if it touches your setup.";
  return "Context only. Skip if you are focused.";
}

export function cleanVerdictLabel(
  meta: Record<string, unknown>,
  locale: AiLocale,
): string {
  const kind = itemKind(meta);
  const verdict = verdictKey(String(meta.verdict ?? "watch"));
  const key = `${verdict}_${kind}` as keyof (typeof VERDICT)["fr"];
  return VERDICT[locale][key] || VERDICT[locale][`watch_${kind}`];
}

function typeLabelFor(
  kind: "repo" | "tool" | "news",
  urgency: string,
  locale: AiLocale,
): string {
  if (locale === "fr") {
    if (kind === "repo") return "Repo";
    if (kind === "tool") return "Outil";
    return urgency === "urgent" ? "Alerte" : "News";
  }
  if (kind === "repo") return "Repo";
  if (kind === "tool") return "Tool";
  return urgency === "urgent" ? "Alert" : "News";
}

function firstClause(text: string, max = 78): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const clause = clean.split(/[.!?\n|·]/)[0]?.trim() || clean;
  if (clause.length <= max) return clause;
  return `${clause.slice(0, max - 1).trim()}…`;
}

function repoShortName(name: string): string {
  if (!name.includes("/")) return name;
  return name.split("/").pop() || name;
}

/**
 * Title that explains what the thing is, not just a raw slug.
 * Pattern: "Name: what it does"
 */
export function explainTitle(
  item: Pick<
    AiIntelItem,
    "title" | "summary" | "urgency" | "metadata" | "pillar"
  >,
  locale: AiLocale,
): { title: string; name: string; typeLabel: string } {
  const meta = (item.metadata ?? {}) as Record<string, unknown>;
  const i18n = getItemI18n(meta);
  const kind =
    item.pillar === "opensource" || meta.kind === "repo"
      ? ("repo" as const)
      : meta.kind === "tool" || item.pillar === "tools"
        ? ("tool" as const)
        : ("news" as const);
  const typeLabel = typeLabelFor(kind, item.urgency, locale);
  const name = pickLocalized(i18n?.title, locale, item.title);

  const whatSource =
    pickLocalized(i18n?.about, locale, "") ||
    readMeta(meta, "tagline") ||
    readMeta(meta, "description") ||
    pickLocalized(i18n?.summary, locale, "") ||
    item.summary ||
    "";

  const what = firstClause(
    whatSource
      .replace(/\d+(\.\d+)?k?\s*stars?/gi, "")
      .replace(/\+\d+(\.\d+)?k?\s*(today|\/j|\/day)/gi, "")
      .replace(/\d+(\.\d+)?k?\s*forks?/gi, "")
      .replace(/^\s*[·|\-—–]+\s*/g, "")
      .trim(),
  );

  if (kind === "repo") {
    const short = repoShortName(name);
    if (what && !what.toLowerCase().startsWith(short.toLowerCase())) {
      return { title: `${short}: ${what}`, name, typeLabel };
    }
    return {
      title:
        locale === "fr"
          ? `${short}: repo open source`
          : `${short}: open-source repo`,
      name,
      typeLabel,
    };
  }

  if (kind === "tool") {
    if (what && what.toLowerCase() !== name.toLowerCase()) {
      return { title: `${name}: ${what}`, name, typeLabel };
    }
    return {
      title: locale === "fr" ? `${name}: outil AI` : `${name}: AI tool`,
      name,
      typeLabel,
    };
  }

  return { title: name, name, typeLabel };
}

function buildFacts(
  meta: Record<string, unknown>,
  locale: AiLocale,
): Array<{ label: string; value: string }> {
  const L =
    locale === "fr"
      ? {
          stars: "Stars",
          today: "Stars / j",
          forks: "Forks",
          lang: "Langage",
          price: "Prix",
          upvotes: "Upvotes",
          api: "API",
          oss: "Open source",
          cat: "Catégorie",
          listed: "Listé",
          score: "Score",
        }
      : {
          stars: "Stars",
          today: "Stars / day",
          forks: "Forks",
          lang: "Language",
          price: "Pricing",
          upvotes: "Upvotes",
          api: "API",
          oss: "Open source",
          cat: "Category",
          listed: "Listed",
          score: "Score",
        };

  const num = (k: string) => {
    const raw = readMeta(meta, k);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? formatStars(n) : raw;
  };

  return [
    readMeta(meta, "score")
      ? { label: L.score, value: `${readMeta(meta, "score")}/100` }
      : null,
    num("stars") ? { label: L.stars, value: num("stars")! } : null,
    num("starsToday")
      ? { label: L.today, value: `+${num("starsToday")}` }
      : null,
    num("forks") ? { label: L.forks, value: num("forks")! } : null,
    readMeta(meta, "language")
      ? { label: L.lang, value: readMeta(meta, "language")! }
      : null,
    readMeta(meta, "pricing")
      ? { label: L.price, value: readMeta(meta, "pricing")! }
      : null,
    readMeta(meta, "upvotes")
      ? { label: L.upvotes, value: String(readMeta(meta, "upvotes")) }
      : null,
    readMeta(meta, "api") ? { label: L.api, value: readMeta(meta, "api")! } : null,
    readMeta(meta, "openSource")
      ? { label: L.oss, value: readMeta(meta, "openSource")! }
      : null,
    readMeta(meta, "categoryLabel")
      ? { label: L.cat, value: readMeta(meta, "categoryLabel")! }
      : null,
    readMeta(meta, "listed")
      ? { label: L.listed, value: readMeta(meta, "listed")! }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;
}

export function getItemI18n(meta: Record<string, unknown>): ItemI18n | null {
  const raw = meta.i18n;
  if (!raw || typeof raw !== "object") return null;
  return raw as ItemI18n;
}

export function resolveBrief(
  item: Pick<
    AiIntelItem,
    "title" | "summary" | "urgency" | "metadata" | "pillar"
  >,
  locale: AiLocale,
): LocalizedBrief {
  const meta = (item.metadata ?? {}) as Record<string, unknown>;
  const i18n = getItemI18n(meta);
  const verdict = verdictKey(String(meta.verdict ?? "watch"));
  const verdictLabel = cleanVerdictLabel(meta, locale);
  const reasonsRaw = Array.isArray(meta.scoreReasons)
    ? (meta.scoreReasons as string[]).filter(
        (r) => !/worth a look|repo chaud/i.test(r),
      )
    : [];

  const explained = explainTitle(item, locale);
  const tldr =
    pickLocalized(i18n?.takeaway, locale, "") || cleanTakeaway(meta, locale);

  const why =
    (locale === "fr" ? i18n?.reasons?.fr : i18n?.reasons?.en)?.slice(0, 3) ||
    reasonsRaw.slice(0, 3);

  return {
    title: explained.title,
    name: explained.name,
    typeLabel: explained.typeLabel,
    tldr: tldr.slice(0, 220),
    why: why.length
      ? why
      : [
          verdictLabel ||
            (locale === "fr" ? "Signal builder" : "Builder signal"),
        ],
    action: ACTION[locale][verdict],
    facts: buildFacts(meta, locale),
  };
}

/**
 * Attach bilingual fields. Re-runs when force=true or FR/EN pair incomplete.
 */
export async function enrichI18nMetadata(
  item: ClassifiedItem,
  opts: { force?: boolean } = {},
): Promise<Record<string, unknown>> {
  const meta = { ...item.metadata };
  const existing = getItemI18n(meta);
  const hasPair =
    Boolean(existing?.title?.fr && existing?.title?.en) &&
    Boolean(existing?.translatedAt);

  if (hasPair && !opts.force) {
    // Refresh clean takeaways without re-hitting translate API
    const takeFr = cleanTakeaway(meta, "fr");
    const takeEn = cleanTakeaway(meta, "en");
    meta.takeaway = takeFr;
    meta.takeawayFr = takeFr;
    meta.takeawayEn = takeEn;
    meta.verdictLabel = cleanVerdictLabel(meta, "fr");
    meta.verdictLabelFr = cleanVerdictLabel(meta, "fr");
    meta.verdictLabelEn = cleanVerdictLabel(meta, "en");
    meta.i18n = {
      ...existing!,
      takeaway: { fr: takeFr, en: takeEn },
      verdictLabel: {
        fr: cleanVerdictLabel(meta, "fr"),
        en: cleanVerdictLabel(meta, "en"),
      },
    };
    return meta;
  }

  const title = item.title;
  const summary = item.summary;
  const about = readMeta(meta, "about") || readMeta(meta, "description") || "";
  const blob = `${title} ${summary} ${about}`;
  const sourceLang = detectTextLang(blob);
  const takeFr = cleanTakeaway(meta, "fr");
  const takeEn = cleanTakeaway(meta, "en");

  const reasons = Array.isArray(meta.scoreReasons)
    ? (meta.scoreReasons as string[])
    : [];

  const i18n: ItemI18n = {
    sourceLang,
    title: { ...(existing?.title ?? {}) },
    summary: { ...(existing?.summary ?? {}) },
    takeaway: { fr: takeFr, en: takeEn },
    about: { ...(existing?.about ?? {}) },
    verdictLabel: {
      fr: cleanVerdictLabel(meta, "fr"),
      en: cleanVerdictLabel(meta, "en"),
    },
    reasons: {
      fr: reasons,
      en: reasons,
    },
  };

  if (sourceLang === "en") {
    i18n.title.en = i18n.title.en || title;
    i18n.summary.en = i18n.summary.en || summary;
    if (about) i18n.about.en = i18n.about.en || about.slice(0, 1200);

    if (!i18n.title.fr) {
      const titleFr = await translateOnce(title, "en", "fr");
      if (titleFr) i18n.title.fr = titleFr;
    }
    if (!i18n.summary.fr) {
      const summaryFr = await translateOnce(summary, "en", "fr");
      if (summaryFr) i18n.summary.fr = summaryFr;
    }
    if (about && !i18n.about.fr) {
      const aboutFr = await translateOnce(about.slice(0, 450), "en", "fr");
      if (aboutFr) i18n.about.fr = aboutFr;
    }
    i18n.translatedAt = new Date().toISOString();
  } else if (sourceLang === "fr") {
    i18n.title.fr = i18n.title.fr || title;
    i18n.summary.fr = i18n.summary.fr || summary;
    if (about) i18n.about.fr = i18n.about.fr || about.slice(0, 1200);

    if (!i18n.title.en) {
      const titleEn = await translateOnce(title, "fr", "en");
      if (titleEn) i18n.title.en = titleEn;
    }
    if (!i18n.summary.en) {
      const summaryEn = await translateOnce(summary, "fr", "en");
      if (summaryEn) i18n.summary.en = summaryEn;
    }
    i18n.translatedAt = new Date().toISOString();
  } else {
    // Unknown → treat as English source (most AI feeds)
    i18n.sourceLang = "en";
    i18n.title.en = i18n.title.en || title;
    i18n.summary.en = i18n.summary.en || summary;
    if (about) i18n.about.en = i18n.about.en || about.slice(0, 1200);
    if (!i18n.title.fr) {
      const titleFr = await translateOnce(title, "en", "fr");
      if (titleFr) i18n.title.fr = titleFr;
    }
    if (!i18n.summary.fr) {
      const summaryFr = await translateOnce(summary, "en", "fr");
      if (summaryFr) i18n.summary.fr = summaryFr;
    }
    i18n.translatedAt = new Date().toISOString();
  }

  // If FR title still missing after EN detect, keep EN title as last resort
  if (!i18n.title.fr) i18n.title.fr = i18n.title.en || title;
  if (!i18n.title.en) i18n.title.en = i18n.title.fr || title;

  meta.takeaway = takeFr;
  meta.takeawayFr = takeFr;
  meta.takeawayEn = takeEn;
  meta.verdictLabel = cleanVerdictLabel(meta, "fr");
  meta.verdictLabelFr = cleanVerdictLabel(meta, "fr");
  meta.verdictLabelEn = cleanVerdictLabel(meta, "en");
  meta.i18n = i18n;
  return meta;
}
