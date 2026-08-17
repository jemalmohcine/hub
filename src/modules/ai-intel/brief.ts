import {
  type ContentKind,
  contentKindLabel,
  detectContentKind,
  productOf,
} from "@/modules/ai-intel/content-kind";
import { detectTextLang } from "@/modules/ai-intel/i18n/detect-lang";
import type { HubLocale } from "@/core/i18n";
import { translateOnce } from "@/modules/ai-intel/i18n/translate";
import { sanitizePlainText } from "@/modules/ai-intel/html-to-text";
import { formatCompactNumber } from "@/lib/numbers";
import { truncateAtWord, plainDash } from "@/lib/text";
import { sourceDisplayName } from "@/modules/ai-intel/source-label";
import type { AiIntelItem, ClassifiedItem } from "@/modules/ai-intel/types";

export type LocalizedBrief = {
  /** Human title that explains what it is */
  title: string;
  /** Raw source name (repo path, tool name, …) */
  name: string;
  /** Repo | Outil | Fonctionnalité | Modèle LLM | Prix | … */
  typeLabel: string;
  /** Precise content kind for tones and layout */
  kind: ContentKind;
  /** Product / company the item is about (Vercel, Claude Code, …) */
  product: string | null;
  /** Real summary / description — never coach fluff */
  tldr: string;
  /** Concrete relevance points (facts), empty if none */
  why: string[];
  /** Optional concrete next step; empty if none */
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

export function readMeta(meta: Record<string, unknown>, key: string): string | null {
  const v = meta[key];
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function pickLocalized(
  bag: { en?: string; fr?: string } | undefined,
  locale: HubLocale,
  fallback: string,
): string {
  if (!bag) return fallback;
  if (locale === "fr") {
    return (bag.fr || fallback).trim();
  }
  return (bag.en || bag.fr || fallback).trim();
}

const VERDICT = {
  fr: {
    use_it_repo: "Utile",
    watch_repo: "À suivre",
    skip_repo: "Peu pertinent",
    use_it_tool: "Utile",
    watch_tool: "À comparer",
    skip_tool: "Peu utile",
    use_it_news: "Impact",
    watch_news: "Contexte",
    skip_news: "Secondaire",
  },
  en: {
    use_it_repo: "Useful",
    watch_repo: "Watch",
    skip_repo: "Low relevance",
    use_it_tool: "Useful",
    watch_tool: "Compare",
    skip_tool: "Low value",
    use_it_news: "Impact",
    watch_news: "Context",
    skip_news: "Secondary",
  },
} as const;

const ACTION = {
  fr: {
    use_it_repo: "Ouvrir le dépôt GitHub",
    use_it_tool: "Essayer l’outil",
    use_it_news: "Lire la source",
    watch_repo: "Voir le dépôt",
    watch_tool: "Voir la fiche",
    watch_news: "Lire l’article",
    skip_repo: "",
    skip_tool: "",
    skip_news: "",
  },
  en: {
    use_it_repo: "Open the GitHub repo",
    use_it_tool: "Try the tool",
    use_it_news: "Read the source",
    watch_repo: "View repository",
    watch_tool: "View details",
    watch_news: "Read the article",
    skip_repo: "",
    skip_tool: "",
    skip_news: "",
  },
} as const;

const FLUFF_RE =
  /bon à savoir|agis seulement|touche (ton|votre) setup|conservez-le en veille|si le sujet vous concerne|safe to ignore|keep it on your radar|good to know|act only if|utile à connaître|planifiez un essai|schedule a trial|interesting, not urgent|contexte général|priorité faible|low priority|general context|signal de pertinence|relevance signal|à parcourir|watchlist|dépôt prometteur|promising repository|activit[eé] modérée|moderate activity/i;

function isFluff(text: string): boolean {
  const value = text.trim();
  if (!value) return true;
  if (value.length < 18 && /^(à |a )/i.test(value)) return true;
  return FLUFF_RE.test(value);
}

/** First candidate that carries real information (never coach fluff). */
function pickClean(...candidates: Array<string | null | undefined>): string {
  for (const candidate of candidates) {
    const value = (candidate ?? "").trim();
    if (value && !isFluff(value)) return value;
  }
  return "";
}

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

/** Factual one-liner from real metadata — never coach fluff. */
export function cleanTakeaway(
  meta: Record<string, unknown>,
  locale: HubLocale,
): string {
  const kind = itemKind(meta);
  const stars = Number(meta.stars) || 0;
  const starsToday = Number(meta.starsToday) || 0;
  const pricing = readMeta(meta, "pricing");
  const language = readMeta(meta, "language");
  const tagline = readMeta(meta, "tagline") || readMeta(meta, "description");

  if (kind === "repo") {
    const parts: string[] = [];
    if (tagline) parts.push(firstClause(tagline, 120));
    if (stars) parts.push(`${formatCompactNumber(stars)}★`);
    if (starsToday) {
      parts.push(
        locale === "fr"
          ? `+${formatCompactNumber(starsToday)}/j`
          : `+${formatCompactNumber(starsToday)}/day`,
      );
    }
    if (language) parts.push(language);
    return parts.join(" · ");
  }

  if (kind === "tool") {
    const parts: string[] = [];
    if (tagline) parts.push(firstClause(tagline, 140));
    if (pricing) parts.push(pricing);
    return parts.join(" · ");
  }

  return tagline ? firstClause(tagline, 180) : "";
}

export function cleanVerdictLabel(
  meta: Record<string, unknown>,
  locale: HubLocale,
): string {
  const kind = itemKind(meta);
  const verdict = verdictKey(String(meta.verdict ?? "watch"));
  const key = `${verdict}_${kind}` as keyof (typeof VERDICT)["fr"];
  return VERDICT[locale][key] || VERDICT[locale][`watch_${kind}`];
}

function firstClause(text: string, max = 78): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const clause = clean.split(/[.!?\n|·]/)[0]?.trim() || clean;
  return truncateAtWord(clause, max);
}

/** A title longer than this stops being a title and becomes a paragraph. */
const MAX_TITLE = 100;

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
    | "title"
    | "summary"
    | "urgency"
    | "metadata"
    | "pillar"
    | "category"
    | "primary_source"
  >,
  locale: HubLocale,
): {
  title: string;
  name: string;
  typeLabel: string;
  kind: ContentKind;
  product: string | null;
} {
  const meta = (item.metadata ?? {}) as Record<string, unknown>;
  const i18n = getItemI18n(meta);
  const kind = detectContentKind(item);
  const typeLabel = contentKindLabel(kind, locale);
  const product = productOf(item);
  const name = pickLocalized(i18n?.title, locale, item.title);

  // Rows organised by earlier pipeline versions stored a whole paragraph here.
  const organizedTitle = readMeta(meta, "organizedTitle") || readMeta(meta, "displayTitle");
  if (organizedTitle) {
    return {
      title: truncateAtWord(organizedTitle, MAX_TITLE),
      name,
      typeLabel,
      kind,
      product,
    };
  }

  // News-like items: enrich headline by kind when possible.
  if (kind !== "repo" && kind !== "tool") {
    if (kind === "pricing") {
      return {
        title: product
          ? locale === "fr"
            ? `${product} : changement de prix`
            : `${product} : pricing change`
          : name,
        name,
        typeLabel,
        kind,
        product,
      };
    }
    if (kind === "model") {
      return {
        title: product
          ? locale === "fr"
            ? `${product} : nouveau modèle`
            : `${product} : new model`
          : name,
        name,
        typeLabel,
        kind,
        product,
      };
    }
    if (kind === "breaking") {
      return {
        title: product
          ? locale === "fr"
            ? `${product} : changement majeur`
            : `${product} : breaking change`
          : name,
        name,
        typeLabel,
        kind,
        product,
      };
    }
    if (kind === "security") {
      return {
        title: product
          ? locale === "fr"
            ? `${product} : sécurité`
            : `${product} : security`
          : name,
        name,
        typeLabel,
        kind,
        product,
      };
    }
    return { title: name, name, typeLabel, kind, product };
  }

  const whatSource = pickClean(
    pickLocalized(i18n?.about, locale, ""),
    readMeta(meta, "tagline"),
    readMeta(meta, "description"),
    pickLocalized(i18n?.summary, locale, ""),
    item.summary,
  );

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
    if (what) {
      return {
        title: truncateAtWord(`${short}: ${what}`, MAX_TITLE),
        name,
        typeLabel,
        kind,
        product,
      };
    }
    return {
      title:
        locale === "fr"
          ? `${short}: dépôt open source`
          : `${short}: open-source repository`,
      name,
      typeLabel,
      kind,
      product,
    };
  }

  if (what && what.toLowerCase() !== name.toLowerCase()) {
    return {
      title: truncateAtWord(`${name}: ${what}`, MAX_TITLE),
      name,
      typeLabel,
      kind,
      product,
    };
  }
  return {
    title: locale === "fr" ? `${name}: outil d’IA` : `${name}: AI tool`,
    name,
    typeLabel,
    kind,
    product,
  };
}

function buildFacts(
  meta: Record<string, unknown>,
  locale: HubLocale,
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
    return Number.isFinite(n) && n > 0 ? formatCompactNumber(n) : raw;
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
    | "title"
    | "summary"
    | "urgency"
    | "metadata"
    | "pillar"
    | "category"
    | "published_at"
    | "ingested_at"
    | "primary_source"
  >,
  locale: HubLocale,
): LocalizedBrief {
  const meta = (item.metadata ?? {}) as Record<string, unknown>;
  const i18n = getItemI18n(meta);
  const verdict = verdictKey(String(meta.verdict ?? "watch"));
  const explained = explainTitle(item, locale);
  const actionGroup =
    explained.kind === "repo"
      ? ("repo" as const)
      : explained.kind === "tool"
        ? ("tool" as const)
        : ("news" as const);

  // Every candidate is checked for fluff individually so old coach text
  // stored in i18n ("Bon à savoir", …) can never surface again.
  const summary = pickClean(
    pickLocalized(i18n?.summary, locale, ""),
    pickLocalized(i18n?.takeaway, locale, ""),
    locale === "fr" ? readMeta(meta, "takeawayFr") : readMeta(meta, "takeawayEn"),
    pickLocalized(i18n?.about, locale, ""),
    cleanTakeaway(meta, locale),
    locale === "en" ? readMeta(meta, "tagline") : null,
    locale === "en" ? readMeta(meta, "description") : null,
    locale === "en" ? readMeta(meta, "about") : null,
    locale === "en" ? item.summary : null,
  );

  const storedTakeaway = pickLocalized(i18n?.takeaway, locale, "");
  const purposeLine = readMeta(meta, "purpose");
  const tldrCandidate = !isFluff(storedTakeaway)
    ? storedTakeaway
    : purposeLine && !isFluff(purposeLine)
      ? purposeLine
      : firstClause(summary, 280) || cleanTakeaway(meta, locale);
  const tldr = (tldrCandidate || firstClause(item.title, 160)).slice(0, 320);

  const reasonsI18n =
    (locale === "fr" ? i18n?.reasons?.fr : i18n?.reasons?.en) || [];
  const reasonsRaw =
    locale === "fr"
      ? []
      : Array.isArray(meta.scoreReasons)
        ? (meta.scoreReasons as string[])
        : [];
  const organizedPoints = Array.isArray(meta.essentialPoints)
    ? (meta.essentialPoints as string[])
        .map((p) => String(p).trim())
        .filter((p) => p && !isFluff(p))
    : [];
  const why = [
    ...organizedPoints.slice(1, 4),
    ...reasonsI18n,
    ...reasonsRaw,
  ]
    .map((r) => String(r).trim())
    .filter((r) => r && !isFluff(r))
    .filter(
      (r) =>
        !/worth a look|repo chaud|signal builder|fit stack|flow de (build|code)|builder/i.test(
          r,
        ),
    )
    .filter((r, i, arr) => arr.indexOf(r) === i)
    .slice(0, 4);

  const actionKey = `${verdict}_${actionGroup}` as keyof (typeof ACTION)["fr"];
  const action = ACTION[locale][actionKey] || "";

  const facts = buildFacts(meta, locale);
  facts.unshift({
    label: locale === "fr" ? "Type" : "Type",
    value: explained.typeLabel,
  });
  if (explained.product) {
    facts.unshift({
      label: locale === "fr" ? "Produit" : "Product",
      value: explained.product,
    });
  }
  if (item.primary_source) {
    facts.push({
      label: locale === "fr" ? "Source" : "Source",
      value: sourceDisplayName(item.primary_source),
    });
  }

  return {
    title: plainDash(explained.title),
    name: explained.name,
    typeLabel: explained.typeLabel,
    kind: explained.kind,
    product: explained.product,
    tldr,
    why,
    action,
    facts,
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
    // Drop legacy coach-fluff summaries so they never surface again
    const scrubbedSummary = { ...(existing!.summary ?? {}) };
    if (scrubbedSummary.fr && isFluff(scrubbedSummary.fr)) {
      delete scrubbedSummary.fr;
    }
    if (scrubbedSummary.en && isFluff(scrubbedSummary.en)) {
      delete scrubbedSummary.en;
    }
    meta.takeaway = takeFr;
    meta.takeawayFr = takeFr;
    meta.takeawayEn = takeEn;
    meta.verdictLabel = cleanVerdictLabel(meta, "fr");
    meta.verdictLabelFr = cleanVerdictLabel(meta, "fr");
    meta.verdictLabelEn = cleanVerdictLabel(meta, "en");
    meta.i18n = {
      ...existing!,
      summary: scrubbedSummary,
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
  const about = sanitizePlainText(
    readMeta(meta, "purpose") ||
      readMeta(meta, "about") ||
      readMeta(meta, "description") ||
      "",
    1200,
  );
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
