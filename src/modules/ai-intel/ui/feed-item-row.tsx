"use client";

import type { ReactNode } from "react";
import { Check, ChevronRight } from "lucide-react";
import { Text } from "@/design-system";
import { resolveBrief } from "@/modules/ai-intel/brief";
import type { HubLocale } from "@/core/i18n";
import { formatDate } from "@/lib/dates";
import { isNearDuplicate, truncateAtWord } from "@/lib/text";
import { t } from "@/modules/ai-intel/i18n/locale";
import { sourceDisplayName } from "@/modules/ai-intel/source-label";
import {
  isHotAlert,
  isTrending,
  itemKind,
  pricingKind,
} from "@/modules/ai-intel/ui/rank";
import { readMetaString } from "@/modules/ai-intel/ui/verdict";
import type { AiIntelItem } from "@/modules/ai-intel/types";
import { cn } from "@/lib/utils";
import { formatCompactNumber } from "@/lib/numbers";

function prettyCount(value: string | null): string | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? formatCompactNumber(n) : value;
}

function Chip({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "urgent" | "ok";
}) {
  return (
    <span
      className={cn(
        "rounded-md px-1.5 py-0.5 text-[length:var(--dh-text-2xs)] font-semibold uppercase tracking-wide",
        tone === "urgent" &&
          "bg-[var(--dh-danger-soft)] text-[var(--dh-danger)]",
        tone === "ok" && "bg-[var(--dh-brand-soft)] text-[var(--dh-brand)]",
        tone === "muted" && "bg-background/80 text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

export function FeedItemRow({
  item,
  locale,
  onOpen,
  compact = false,
}: {
  item: AiIntelItem;
  locale: HubLocale;
  onOpen: (item: AiIntelItem) => void;
  compact?: boolean;
}) {
  const copy = t(locale);
  const meta = (item.metadata ?? {}) as Record<string, unknown>;
  const brief = resolveBrief(item, locale);
  const stars = prettyCount(readMetaString(meta, "stars"));
  const starsToday = prettyCount(readMetaString(meta, "starsToday"));
  const kind = itemKind(item);
  const pricing = pricingKind(item);
  const hot = isHotAlert(item);
  const trending = isTrending(item);
  const isRead = Boolean(item.read);
  const publishedLabel = formatDate(item.published_at, locale, "dayMonth");
  const teaser =
    brief.tldr && !isNearDuplicate(brief.tldr, brief.title)
      ? truncateAtWord(brief.tldr, compact ? 110 : 160)
      : null;

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

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      aria-label={`${brief.title}. ${isRead ? copy.read : copy.unread}`}
      className={cn(
        "mb-1.5 flex w-full items-start gap-3 rounded-2xl border border-transparent px-3 py-3 text-left transition-colors",
        "active:scale-[0.995]",
        hot
          ? "border-[var(--dh-danger)]/15 bg-[var(--dh-danger-soft)]/35 hover:bg-[var(--dh-danger-soft)]/45"
          : "bg-background/70 hover:bg-muted/45",
        !isRead && "ring-1 ring-[var(--dh-brand)]/10",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="mb-1.5 flex flex-wrap items-center gap-1">
          {hot ? (
            <Chip tone="urgent">{copy.urgent}</Chip>
          ) : trending ? (
            <Chip tone="ok">{copy.trending}</Chip>
          ) : (
            <Chip>{brief.typeLabel}</Chip>
          )}
        </span>

        <Text
          weight="medium"
          className={cn(
            "text-balance leading-snug",
            compact
              ? "line-clamp-2 text-[length:var(--dh-text-sm)]"
              : "line-clamp-2 text-[length:var(--dh-text-sm)]",
          )}
        >
          {brief.title}
        </Text>

        {teaser ? (
          <Text
            size="sm"
            tone="muted"
            className="mt-1 line-clamp-2 leading-snug"
          >
            {teaser}
          </Text>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[length:var(--dh-text-2xs)] text-muted-foreground">
          <span>{sourceDisplayName(item.primary_source)}</span>
          {publishedLabel ? <span>· {publishedLabel}</span> : null}
          {metricParts.length > 0 ? (
            <span>· {metricParts.join(" · ")}</span>
          ) : null}
        </div>
      </span>

      <span className="mt-1 flex shrink-0 flex-col items-center gap-2">
        {isRead ? (
          <Check
            className="h-4 w-4 text-[var(--dh-brand)]"
            strokeWidth={2.5}
            aria-hidden
          />
        ) : (
          <span className="h-2 w-2 rounded-full bg-[var(--dh-brand)]" aria-hidden />
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground/55" />
      </span>
    </button>
  );
}
