import type { AiLocale } from "@/modules/ai-intel/i18n/locale";
import { translateOnce } from "@/modules/ai-intel/i18n/translate";

export type OrganizedIntel = {
  title: string;
  purpose: string;
  essentialPoints: string[];
  longAbout: string;
};

function stripMarkdown(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`{1,3}[^`]+`{1,3}/g, " ")
    .replace(/[#>*_~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readmeParagraphs(readme: string): string[] {
  const blocks = readme
    .split(/\n{2,}/)
    .map((b) => stripMarkdown(b))
    .filter((b) => b.length >= 40);

  const skip =
    /^(license|copyright|table of contents|contributing|installation only|build status|codecov)/i;

  return blocks.filter((b) => !skip.test(b)).slice(0, 12);
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
      const text = stripMarkdown(bullet[1]);
      if (text.length >= 12 && text.length <= 220) bullets.push(text);
    }
  }

  if (bullets.length >= 2) return bullets.slice(0, 6);

  for (const line of lines) {
    const bullet = line.trim().match(/^[-*•]\s+(.+)/);
    if (!bullet) continue;
    const text = stripMarkdown(bullet[1]);
    if (text.length >= 16 && text.length <= 220) bullets.push(text);
    if (bullets.length >= 6) break;
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
    const text = stripMarkdown(raw);
    const isMatch = text.match(
      /\b(is an?|is the|provides?|lets you|allows you|enables?|helps? you|library for|tool for|framework for|designed to|built to|convert(s|ing)?|transcri(be|ption)|speech.to.text|voice.to.text)\b/i,
    );
    if (isMatch) {
      return firstSentence(text, 200);
    }
  }

  for (const raw of candidates) {
    const text = firstSentence(stripMarkdown(raw), 200);
    if (text.length >= 30) return text;
  }

  return description ? firstSentence(description, 160) : name;
}

function firstSentence(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const sentence = clean.split(/(?<=[.!?])\s+/)[0]?.trim() || clean;
  if (sentence.length <= max) return sentence;
  return `${sentence.slice(0, max - 1).trim()}…`;
}

function shortName(name: string): string {
  if (name.includes("/")) return name.split("/").pop() || name;
  return name;
}

function buildTitle(name: string, purpose: string, locale: AiLocale): string {
  const short = shortName(name);
  const purposeClause = firstSentence(purpose, 120);
  if (!purposeClause) {
    return locale === "fr" ? `${short}: dépôt open source` : `${short}: open-source repo`;
  }
  const lowerPurpose = purposeClause.toLowerCase();
  if (lowerPurpose.startsWith(short.toLowerCase())) return purposeClause;
  if (lowerPurpose.length < 24) return `${short}: ${purposeClause}`;
  return `${short}: ${firstSentence(purposeClause, 100)}`;
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
  locale?: AiLocale;
}): OrganizedIntel {
  const locale = input.locale ?? "fr";
  const description = (input.description || "").trim();
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
    if (!essentialPoints.some((p) => p.toLowerCase() === bullet.toLowerCase())) {
      essentialPoints.push(bullet);
    }
    if (essentialPoints.length >= 5) break;
  }

  for (const para of paragraphs) {
    const sentence = firstSentence(para, 180);
    if (
      sentence.length >= 40 &&
      !essentialPoints.some((p) => p.toLowerCase().includes(sentence.slice(0, 30).toLowerCase()))
    ) {
      essentialPoints.push(sentence);
    }
    if (essentialPoints.length >= 5) break;
  }

  if (input.topics?.length) {
    essentialPoints.push(
      locale === "fr"
        ? `Sujets : ${input.topics.slice(0, 6).join(", ")}`
        : `Topics: ${input.topics.slice(0, 6).join(", ")}`,
    );
  }

  if (input.language) {
    essentialPoints.push(
      locale === "fr" ? `Langage principal : ${input.language}` : `Main language: ${input.language}`,
    );
  }

  const longAbout = [purpose, ...paragraphs.slice(0, 4)].filter(Boolean).join("\n\n").slice(0, 2400);

  return {
    title,
    purpose,
    essentialPoints: essentialPoints.slice(0, 6),
    longAbout,
  };
}

/** French labels when source content is English. */
export async function organizeIntelLocalized(input: {
  kind: "repo" | "tool" | "news";
  name: string;
  description?: string | null;
  readme?: string | null;
  articleBody?: string | null;
  topics?: string[];
  language?: string | null;
  locale?: AiLocale;
}): Promise<OrganizedIntel & { locale: AiLocale }> {
  const locale = input.locale ?? "fr";
  const base = organizeIntel({ ...input, locale: "en" });

  if (locale === "en") {
    return { ...base, locale };
  }

  const titleFr =
    (await translateOnce(base.title, "en", "fr")) || buildTitle(input.name, base.purpose, "fr");

  const purposeFr = (await translateOnce(base.purpose, "en", "fr")) || base.purpose;

  const pointsFr: string[] = [];
  for (const point of base.essentialPoints) {
    if (/^(Sujets|Topics|Langage|Main language)/i.test(point)) {
      pointsFr.push(point);
      continue;
    }
    const translated = await translateOnce(point, "en", "fr");
    pointsFr.push(translated || point);
  }

  const longFr = (await translateOnce(base.longAbout.slice(0, 900), "en", "fr")) || base.longAbout;

  return {
    title: titleFr,
    purpose: purposeFr,
    essentialPoints: pointsFr,
    longAbout: longFr,
    locale,
  };
}
