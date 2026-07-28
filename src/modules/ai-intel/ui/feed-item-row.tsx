"use client";

import { ChevronRight } from "lucide-react";
import { Text } from "@/design-system";
import { resolveBrief } from "@/modules/ai-intel/brief";
import type { AiLocale } from "@/modules/ai-intel/i18n/locale";
import { t } from "@/modules/ai-intel/i18n/locale";
import { isBeneficial, itemScore } from "@/modules/ai-intel/ui/rank";
import { readMetaString } from "@/modules/ai-intel/ui/verdict";
import type { AiIntelItem } from "@/modules/ai-intel/types";
import { cn } from "@/lib/utils";
import { formatStars } from "@/modules/ai-intel/score";

function prettyCount(value: string | null): string | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? formatStars(n) : value;
}

/**
 * Scan-first row:
 * type · signal
 * Name: what it is
 * What to do · key metric
 */
export function FeedItemRow({
  item,
  locale,
  onOpen,
}: {
  item: AiIntelItem;
  locale: AiLocale;
  onOpen: (item: AiIntelItem) => void;
}) {
  const copy = t(locale);
  const meta = (item.metadata ?? {}) as Record<string, unknown>;
  const brief = resolveBrief(item, locale);
  const stars = prettyCount(readMetaString(meta, "stars"));
  const starsToday = prettyCount(readMetaString(meta, "starsToday"));
  const pricing = readMetaString(meta, "pricing");
  const score = itemScore(item);
  const beneficial = isBeneficial(item);
  const isRepo = item.pillar === "opensource" || meta.kind === "repo";

  const signal =
    item.urgency === "urgent"
      ? copy.impact
      : beneficial
        ? copy.useful
        : null;

  const metric = isRepo
    ? starsToday
      ? `+${starsToday}${locale === "fr" ? "/j" : "/day"}`
      : stars
        ? `${stars}★`
        : null
    : pricing || (score > 0 ? `${score}/100` : null);

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl px-3.5 py-3.5 text-left transition-colors",
        "active:scale-[0.995]",
        item.urgency === "urgent"
          ? "bg-[var(--dh-danger-soft)]/40"
          : beneficial
            ? "bg-[var(--dh-brand-soft)]/30"
            : "bg-muted/30 hover:bg-muted/50",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-background/60 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {brief.typeLabel}
          </span>
          {signal ? (
            <span
              className={cn(
                "text-[11px] font-semibold uppercase tracking-wide",
                item.urgency === "urgent"
                  ? "text-[var(--dh-danger)]"
                  : "text-[var(--dh-brand)]",
              )}
            >
              {signal}
            </span>
          ) : null}
        </span>

        <Text weight="medium" className="line-clamp-2 text-[15px] leading-snug">
          {brief.title}
        </Text>

        <Text
          size="sm"
          tone="muted"
          className="mt-1.5 line-clamp-1 leading-relaxed"
        >
          {brief.action}
          {metric ? ` · ${metric}` : ""}
        </Text>
      </span>
      <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-muted-foreground/55" />
    </button>
  );
}
