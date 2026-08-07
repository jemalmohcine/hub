import type { HubLocale } from "@/core/i18n";
import { translateOnce } from "@/modules/ai-intel/i18n/translate";
import {
  isLlmOrganizeAvailable,
  llmOrganizeIntel,
  type LlmIntelDecision,
} from "@/modules/ai-intel/llm-organize";
import {
  firstCleanClause,
  isGarbageText,
  sanitizePlainText,
} from "@/modules/ai-intel/html-to-text";

export type OrganizedIntel = {
  title: string;
  purpose: string;
  essentialPoints: string[];
  longAbout: string;
};

function cleanLine(text: string): string {
  return sanitizePlainText(text, 500);
}

function readmeParagraphs(readme: string): string[] {
  const blocks = readme
    .split(/\n{2,}/)
    .map((b) => cleanLine(b))
    .filter((b) => b.length >= 40 && !isGarbageText(b));

  const skip =
    /^(license|copyright|table of contents|contributing|installation only|build status|codecov|arrêter|stop wasting)/i;

  return blocks.filter((b) => !skip.test(b)).slice(0, 8);
}

function extractBullets(readme: string): string[] {
  const lines = readme.split("\n");
  const bullets: string[] = [];
  let inFeatures = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^#{1,3}\s*(features?|what it does|highlights?|capabilities|key points)/i.test(trimmed)) {
      inFeatures = true;
      continue;
    }
    if (inFeatures && /^#{1,3}\s/.test(trimmed)) {
      inFeatures = false;
    }
    const bullet = trimmed.match(/^[-*•]\s+(.+)/);
    if (bullet) {
      const text = cleanLine(bullet[1]);
      if (text.length >= 12 && text.length <= 200 && !isGarbageText(text)) {
        bullets.push(text);
      }
    }
  }

  if (bullets.length >= 2) return bullets.slice(0, 5);

  for (const line of lines) {
    const bullet = line.trim().match(/^[-*•]\s+(.+)/);
    if (!bullet) continue;
    const text = cleanLine(bullet[1]);
    if (text.length >= 16 && text.length <= 200 && !isGarbageText(text)) {
      bullets.push(text);
    }
    if (bullets.length >= 5) break;
  }

  return bullets;
}

function inferPurpose(
  name: string,
  description: string,
  paragraphs: string[],
): string {
  const candidates = [description, ...paragraphs].filter(Boolean);

  for (const raw of candidates) {
    const text = cleanLine(raw);
    if (!text) continue;
    const isMatch = text.match(
      /\b(is an?|is the|provides?|lets you|allows you|enables?|helps? you|library for|tool for|framework for|designed to|built to|convert(s|ing)?|transcri(be|ption)|speech.to.text|voice.to.text|graphe|graph for|identity provider|fournisseur)\b/i,
    );
    if (isMatch) {
      return firstCleanClause(text, 160);
    }
  }

  for (const raw of candidates) {
    const text = firstCleanClause(raw, 160);
    if (text.length >= 24) return text;
  }

  return description ? firstCleanClause(description, 140) : shortName(name);
}

function shortName(name: string): string {
  if (name.includes("/")) return name.split("/").pop() || name;
  return name;
}

/** Short title: name + concise what-it-does (never a wall of text). */
function buildTitle(name: string, purpose: string, locale: HubLocale): string {
  const short = shortName(name);
  const purposeClause = firstCleanClause(purpose, 72);
  if (!purposeClause) {
    return locale === "fr" ? `${short} — outil dev` : `${short} — dev tool`;
  }
  const lowerPurpose = purposeClause.toLowerCase();
  if (lowerPurpose.startsWith(short.toLowerCase())) {
    return purposeClause.length <= 90 ? purposeClause : firstCleanClause(purposeClause, 88);
  }
  return `${short} — ${purposeClause}`;
}

/** Turn scraped content into a human title + essential points (no star-count titles). */
export function organizeIntel(input: {
  kind: "repo" | "tool" | "news";
  name: string;
  description?: string | null;
  readme?: string | null;
  articleBody?: string | null;
  topics?: string[];
  language?: string | null;
  locale?: HubLocale;
}): OrganizedIntel {
  const locale = input.locale ?? "fr";
  const description = cleanLine((input.description || "").trim());
  const readme = input.readme || "";
  const articleBody = input.articleBody || "";
  const paragraphs = readme
    ? readmeParagraphs(readme)
    : articleBody
      ? readmeParagraphs(articleBody)
      : [];

  const purpose = inferPurpose(input.name, description, paragraphs);
  const title = buildTitle(input.name, purpose, locale);

  const essentialPoints: string[] = [];

  if (purpose) essentialPoints.push(purpose);

  const bullets = extractBullets(readme || articleBody);
  for (const bullet of bullets) {
    if (
      !essentialPoints.some(
        (p) => p.toLowerCase() === bullet.toLowerCase() || p.includes(bullet.slice(0, 24)),
      )
    ) {
      essentialPoints.push(bullet);
    }
    if (essentialPoints.length >= 4) break;
  }

  for (const para of paragraphs) {
    const sentence = firstCleanClause(para, 140);
    if (
      sentence.length >= 40 &&
      !essentialPoints.some((p) =>
        p.toLowerCase().includes(sentence.slice(0, 28).toLowerCase()),
      )
    ) {
      essentialPoints.push(sentence);
    }
    if (essentialPoints.length >= 4) break;
  }

  const longAbout = [purpose, ...paragraphs.slice(0, 3)]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 1800);

  return {
    title,
    purpose,
    essentialPoints: essentialPoints.slice(0, 4),
    longAbout,
  };
}

/** French labels when source content is English. Uses the LLM when Gemini is configured. */
export async function organizeIntelLocalized(input: {
  kind: "repo" | "tool" | "news";
  name: string;
  description?: string | null;
  readme?: string | null;
  articleBody?: string | null;
  topics?: string[];
  language?: string | null;
  locale?: HubLocale;
  metrics?: string | null;
  url?: string | null;
  source?: string | null;
  publishedAt?: string | null;
}): Promise<
  OrganizedIntel & {
    locale: HubLocale;
    organizedBy?: "llm" | "heuristic";
    llmModel?: string;
    decision?: LlmIntelDecision;
  }
> {
  const locale = input.locale ?? "fr";
  const description = cleanLine((input.description || "").trim());

  const sourceText = [
    description,
    input.readme || "",
    input.articleBody || "",
  ]
    .filter(Boolean)
    .join("\n\n");

  if (isLlmOrganizeAvailable() && sourceText.length >= 80) {
    const llm = await llmOrganizeIntel({
      kind: input.kind,
      name: input.name,
      description,
      metrics: input.metrics,
      sourceText,
      url: input.url,
      source: input.source,
      publishedAt: input.publishedAt,
      locale,
    });
    if (llm) {
      return {
        title: llm.title,
        purpose: llm.purpose,
        essentialPoints: llm.essentialPoints,
        longAbout: llm.longAbout,
        locale,
        organizedBy: "llm",
        llmModel: llm.model,
        decision: llm,
      };
    }
  }

  const base = organizeIntel({ ...input, locale: "en" });

  if (locale === "en") {
    return { ...base, locale, organizedBy: "heuristic" };
  }

  const titleFr =
    (await translateOnce(base.title, "en", "fr")) ||
    buildTitle(input.name, base.purpose, "fr");

  const purposeFr =
    (await translateOnce(base.purpose, "en", "fr")) || base.purpose;

  const pointsFr: string[] = [];
  for (const point of base.essentialPoints) {
    const translated = await translateOnce(point, "en", "fr");
    const next = sanitizePlainText(translated || point, 220);
    if (next && !isGarbageText(next)) pointsFr.push(next);
  }

  const longFr =
    (await translateOnce(base.longAbout.slice(0, 700), "en", "fr")) ||
    base.longAbout;
  const longClean = sanitizePlainText(longFr, 1800);

  return {
    title: sanitizePlainText(titleFr, 120) || base.title,
    purpose: sanitizePlainText(purposeFr, 200) || base.purpose,
    essentialPoints: pointsFr,
    longAbout: longClean || base.longAbout,
    locale,
    organizedBy: "heuristic",
  };
}
