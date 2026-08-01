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
        "rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        tone === "urgent" &&
          "bg-[var(--dh-danger-soft)] text-[var(--dh-danger)]",
        tone === "ok" && "bg-[var(--dh-brand-soft)] text-[var(--dh-brand)]",
        tone === "warn" &&
          "bg-[var(--dh-warning-soft)] text-[var(--dh-warning)]",
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
  locale: AiLocale;
  onOpen: (item: AiIntelItem) => void;
  compact?: boolean;
}) {
  const copy = t(locale);
  const meta = (item.metadata ?? {}) as Record<string, unknown>;
  const brief = resolveBrief(item, locale);
  const recap = buildEssentialRecap(item, locale);
  const stars = prettyCount(readMetaString(meta, "stars"));
  const starsToday = prettyCount(readMetaString(meta, "starsToday"));
  const score = readMetaString(meta, "score");
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
        <span className="mb-2 flex flex-wrap items-center gap-1">
          <Chip tone={hot ? "urgent" : contentKindTone(brief.kind)}>
            {brief.typeLabel}
          </Chip>
          {brief.product ? <Chip>{brief.product}</Chip> : null}
          {trending ? <Chip tone="ok">{copy.trending}</Chip> : null}
          {hot ? <Chip tone="urgent">{copy.urgent}</Chip> : null}
          {score ? (
            <Chip tone="ok">
              {copy.score} {score}
            </Chip>
          ) : null}
        </span>

        <Text
          weight="medium"
          className={cn(
            "text-balance leading-snug",
            compact ? "line-clamp-2 text-[14px]" : "line-clamp-3 text-[15px]",
          )}
        >
          {brief.title}
        </Text>

        <ul className="mt-2.5 space-y-1.5">
          {recap.map((point) => (
            <li key={point.id} className="flex gap-2 text-left">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--dh-brand)]" />
              <span className="min-w-0">
                <span className="text-[11px] font-semibold text-foreground/85">
                  {point.label}
                </span>
                <span className="mt-0.5 block text-[12px] leading-relaxed text-muted-foreground line-clamp-2">
                  {point.teaser}
                </span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
          <span>{item.primary_source}</span>
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
