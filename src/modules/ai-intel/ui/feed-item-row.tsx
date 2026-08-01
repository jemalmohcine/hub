"use client";

import type { ReactNode } from "react";
import { Check, ChevronRight } from "lucide-react";
import { Text } from "@/design-system";
import { resolveBrief } from "@/modules/ai-intel/brief";
import { buildEssentialRecap } from "@/modules/ai-intel/essential-recap";
import { contentKindTone } from "@/modules/ai-intel/content-kind";
import type { AiLocale } from "@/modules/ai-intel/i18n/locale";
import { t } from "@/modules/ai-intel/i18n/locale";
import {
  isHotAlert,
  isTrending,
  itemKind,
  pricingKind,
} from "@/modules/ai-intel/ui/rank";
import { readMetaString } from "@/modules/ai-intel/ui/verdict";
import type { AiIntelItem } from "@/modules/ai-intel/types";
import { cn } from "@/lib/utils";
import { formatStars } from "@/modules/ai-intel/score";

function prettyCount(value: string | null): string | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? formatStars(n) : value;
}

function formatCardDate(iso: string | null | undefined, locale: AiLocale): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Chip({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "urgent" | "ok" | "warn";
}) {
  return (
    <span
      className={cn(
        "rounded-md px-1.5 py-0.5 text-[11px] font-semibold tracking-wide",
        tone === "urgent" &&
          "bg-[var(--dh-danger-soft)] text-[var(--dh-danger)]",
        tone === "ok" && "bg-[var(--dh-brand-soft)] text-[var(--dh-brand)]",
        tone === "warn" &&
          "bg-[var(--dh-warning-soft)] text-[var(--dh-warning)]",
        tone === "muted" && "bg-background/70 text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

/**
 * Scan-first row — read = small check on the right only (no reorder).
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
  const recap = buildEssentialRecap(item, locale);
  const stars = prettyCount(readMetaString(meta, "stars"));
  const starsToday = prettyCount(readMetaString(meta, "starsToday"));
  const kind = itemKind(item);
  const pricing = pricingKind(item);
  const hot = isHotAlert(item);
  const trending = isTrending(item);
  const isRead = Boolean(item.read);
  const publishedLabel = formatCardDate(item.published_at, locale);

  const metricParts: string[] = [];
  if (kind === "repo") {
    if (stars) metricParts.push(`${stars}★`);
    if (starsToday) metricParts.push(`+${starsToday}${copy.starsToday}`);
  } else if (pricing) {
    metricParts.push(
      pricing === "free"
        ? copy.free
        : pricing === "freemium"
          ? copy.freemium
          : copy.paid,
    );
  }

  const subtitle = recap
    .map((point) => point.teaser)
    .filter(Boolean)
    .slice(0, 2)
    .join(" · ");

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      aria-label={`${brief.title}. ${isRead ? copy.read : copy.unread}`}
      className={cn(
        "mb-1.5 flex w-full items-start gap-3 rounded-2xl px-3.5 py-3.5 text-left transition-colors",
        "active:scale-[0.995]",
        hot ? "bg-[var(--dh-danger-soft)]/40" : "bg-muted/35 hover:bg-muted/50",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <Chip tone={hot ? "urgent" : contentKindTone(brief.kind)}>
            {brief.typeLabel}
          </Chip>
          {brief.product ? <Chip>{brief.product}</Chip> : null}
          {publishedLabel ? (
            <Chip>
              {copy.published} {publishedLabel}
            </Chip>
          ) : null}
          {kind === "repo" ? <Chip tone="ok">{copy.free}</Chip> : null}
          {kind !== "repo" && pricing === "free" ? (
            <Chip tone="ok">{copy.free}</Chip>
          ) : null}
          {kind !== "repo" && pricing === "freemium" ? (
            <Chip>{copy.freemium}</Chip>
          ) : null}
          {kind !== "repo" && pricing === "paid" ? (
            <Chip tone="warn">{copy.paid}</Chip>
          ) : null}
          {trending ? <Chip tone="ok">{copy.trending}</Chip> : null}
          {hot ? <Chip tone="urgent">{copy.urgent}</Chip> : null}
        </span>

        <Text weight="medium" className="line-clamp-2 text-[15px] leading-snug">
          {brief.title}
        </Text>

        {subtitle || metricParts.length > 0 ? (
          <Text
            size="sm"
            tone="muted"
            className="mt-1.5 line-clamp-2 leading-relaxed"
          >
            {[subtitle, ...metricParts].filter(Boolean).join(" · ")}
          </Text>
        ) : null}
      </span>
      <span className="mt-2.5 flex shrink-0 items-center gap-1.5">
        {isRead ? (
          <Check
            className="h-4 w-4 text-[var(--dh-brand)]"
            strokeWidth={2.5}
            aria-hidden
          />
        ) : null}
        <ChevronRight className="h-4 w-4 text-muted-foreground/55" />
      </span>
    </button>
  );
}
