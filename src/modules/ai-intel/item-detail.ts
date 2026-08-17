import type { HubLocale } from "@/core/i18n";
import { dedupeTexts, isNearDuplicate } from "@/lib/text";
import { readMeta, resolveBrief } from "@/modules/ai-intel/brief";
import { buildEssentialRecap } from "@/modules/ai-intel/essential-recap";
import { sanitizePlainText } from "@/modules/ai-intel/html-to-text";
import { t } from "@/modules/ai-intel/i18n/locale";
import type { AiIntelItem } from "@/modules/ai-intel/types";

/** Past this length the reader gets a "read more" toggle instead of a wall. */
export const COLLAPSE_THRESHOLD = 420;

export type DetailSection =
  | {
      kind: "prose";
      id: string;
      label: string;
      text: string;
      /** True when the text is long enough to be worth folding. */
      collapsible: boolean;
      /** Renders inside a muted box — used for "impact". */
      boxed?: boolean;
      muted?: boolean;
    }
  | { kind: "bullets"; id: string; label: string; items: string[] }
  | {
      kind: "facts";
      id: string;
      label: string;
      facts: Array<{ label: string; value: string }>;
    };

export type ItemDetail = {
  title: string;
  /** One-paragraph answer to "what is this?" — also the a11y description. */
  summary: string;
  sections: DetailSection[];
};

function paragraphsOf(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => sanitizePlainText(paragraph, 1200))
    .filter((paragraph) => paragraph.length >= 40);
}

type DetailItem = Pick<
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
>;

/**
 * Assemble everything worth reading about an item, once.
 *
 * The pipeline stores the same sentence in several places (`purpose`,
 * `essentialPoints[0]`, and the head of `about`), so rendering those fields
 * side by side repeated the summary three times. Every block here is checked
 * against what has already been shown and dropped when it adds nothing.
 */
export function buildItemDetail(
  item: DetailItem,
  locale: HubLocale,
): ItemDetail {
  const copy = t(locale);
  const meta = (item.metadata ?? {}) as Record<string, unknown>;
  const brief = resolveBrief(item, locale);

  const summary = sanitizePlainText(
    readMeta(meta, "purpose") || brief.tldr || item.summary || "",
    700,
  );

  const storedPoints = Array.isArray(meta.essentialPoints)
    ? (meta.essentialPoints as unknown[]).map((point) =>
        sanitizePlainText(String(point), 400),
      )
    : [];

  const rawPoints = storedPoints.some((point) => point.length > 0)
    ? storedPoints
    : buildEssentialRecap(item, locale).map(
        (point) => `${point.label} : ${point.teaser}`,
      );

  // A bullet that restates the summary is noise, not a second point.
  const points = dedupeTexts(rawPoints).filter(
    (point) => !isNearDuplicate(point, summary),
  );

  const impact = sanitizePlainText(readMeta(meta, "impact") || "", 600);

  // `about` is built by concatenating purpose + points + impact for LLM-analysed
  // items, so most of it is already on screen. Keep only the new paragraphs.
  const shown = [summary, ...points, impact].filter(Boolean);
  const extraParagraphs = paragraphsOf(
    readMeta(meta, "about") || readMeta(meta, "longSummary") || "",
  ).filter(
    (paragraph) => !shown.some((seen) => isNearDuplicate(paragraph, seen)),
  );
  const fullDetail = dedupeTexts(extraParagraphs).join("\n\n");

  const sections: DetailSection[] = [];

  if (summary) {
    sections.push({
      kind: "prose",
      id: "summary",
      label: copy.tldr,
      text: summary,
      collapsible: summary.length > COLLAPSE_THRESHOLD,
    });
  }

  if (points.length > 0) {
    sections.push({
      kind: "bullets",
      id: "points",
      label: copy.essentials,
      items: points,
    });
  }

  if (impact && !isNearDuplicate(impact, summary)) {
    sections.push({
      kind: "prose",
      id: "impact",
      label: copy.impact,
      text: impact,
      collapsible: false,
      boxed: true,
    });
  }

  if (fullDetail) {
    sections.push({
      kind: "prose",
      id: "detail",
      label: copy.fullDetail,
      text: fullDetail,
      collapsible: fullDetail.length > COLLAPSE_THRESHOLD,
    });
  }

  if (brief.facts.length > 0) {
    sections.push({
      kind: "facts",
      id: "facts",
      label: copy.facts,
      facts: brief.facts,
    });
  }

  return { title: brief.title, summary, sections };
}
