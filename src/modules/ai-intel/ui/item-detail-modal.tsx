"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ExternalLink, Languages, Loader2 } from "lucide-react";
import {
  Badge,
  Button,
  Cluster,
  Stack,
  Text,
  useAsyncAction,
} from "@/design-system";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SaveButton } from "@/modules/ai-intel/ui/save-button";
import { ensureItemTranslation } from "@/modules/ai-intel/actions-i18n";
import { getItemI18n, resolveBrief } from "@/modules/ai-intel/brief";
import {
  buildEssentialRecap,
  type EssentialPoint,
} from "@/modules/ai-intel/essential-recap";
import { contentKindTone } from "@/modules/ai-intel/content-kind";
import type { AiLocale } from "@/modules/ai-intel/i18n/locale";
import { t } from "@/modules/ai-intel/i18n/locale";
import { isHotAlert } from "@/modules/ai-intel/ui/rank";
import { readMetaString, verdictTone } from "@/modules/ai-intel/ui/verdict";
import { type AiIntelItem } from "@/modules/ai-intel/types";
import { cn } from "@/lib/utils";

function websiteHref(website: string | null): string | null {
  if (!website) return null;
  return website.startsWith("http") ? website : `https://${website}`;
}

function EssentialPointRow({
  point,
  expanded,
  onToggle,
}: {
  point: EssentialPoint;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-muted/25">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-start gap-3 px-3.5 py-3 text-left"
      >
        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--dh-brand)]" />
        <span className="min-w-0 flex-1">
          <Text size="sm" weight="medium" className="leading-snug">
            {point.label}
          </Text>
          <Text size="sm" tone="muted" className="mt-1 line-clamp-2 leading-relaxed">
            {point.teaser}
          </Text>
        </span>
        <ChevronDown
          className={cn(
            "mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>
      {expanded ? (
        <div className="border-t border-border/70 px-3.5 py-3">
          <Text size="sm" className="leading-relaxed whitespace-pre-wrap">
            {point.detail}
          </Text>
        </div>
      ) : null}
    </div>
  );
}

export function ItemDetailModal({
  item,
  open,
  locale,
  onOpenChange,
  onMetadataUpdate,
}: {
  item: AiIntelItem | null;
  open: boolean;
  locale: AiLocale;
  onOpenChange: (open: boolean) => void;
  onMetadataUpdate?: (itemId: string, metadata: Record<string, unknown>) => void;
}) {
  const copy = t(locale);
  const { run, pending } = useAsyncAction();
  const [localItem, setLocalItem] = useState(item);
  const [expandedPoint, setExpandedPoint] = useState<string | null>(null);

  useEffect(() => {
    setLocalItem(item);
    setExpandedPoint(null);
  }, [item]);

  useEffect(() => {
    if (!open || !localItem) return;
    const i18n = getItemI18n((localItem.metadata ?? {}) as Record<string, unknown>);
    if (i18n?.translatedAt) return;

    void run(
      async () => {
        const meta = await ensureItemTranslation(localItem.id);
        setLocalItem((prev) =>
          prev ? { ...prev, metadata: meta as Record<string, unknown> } : prev,
        );
        onMetadataUpdate?.(localItem.id, meta as Record<string, unknown>);
      },
      {
        silent: true,
        onError: () => {
          /* keep original language */
        },
      },
    );
  }, [open, localItem?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!localItem) return null;

  const meta = (localItem.metadata ?? {}) as Record<string, unknown>;
  const brief = resolveBrief(localItem, locale);
  const recap = buildEssentialRecap(localItem, locale);
  const i18n = getItemI18n(meta);
  const website = readMetaString(meta, "website");
  const image = readMetaString(meta, "image");
  const score = readMetaString(meta, "score");
  const verdictLabel =
    (locale === "fr" ? i18n?.verdictLabel?.fr : i18n?.verdictLabel?.en) ||
    readMetaString(meta, "verdictLabel");
  const visitUrl = websiteHref(website) || localItem.url;
  const translated = Boolean(i18n?.translatedAt);
  const dateLocale = locale === "fr" ? "fr-FR" : "en-US";
  const kindTone = contentKindTone(brief.kind);
  const kindBadgeTone =
    kindTone === "urgent"
      ? ("danger" as const)
      : kindTone === "ok"
        ? ("success" as const)
        : kindTone === "warn"
          ? ("warning" as const)
          : ("neutral" as const);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto pb-[calc(var(--dh-safe-bottom)+0.75rem)] sm:max-w-lg">
        <DialogHeader>
          <Cluster gap={2} className="mb-2 flex-wrap">
            {isHotAlert(localItem) ? (
              <Badge tone="danger">{copy.urgent}</Badge>
            ) : null}
            <Badge tone={kindBadgeTone}>{brief.typeLabel}</Badge>
            {brief.product ? (
              <Badge tone="neutral">{brief.product}</Badge>
            ) : null}
            {verdictLabel ? (
              <Badge tone={verdictTone(meta.verdict)}>{verdictLabel}</Badge>
            ) : null}
            {score ? (
              <Badge tone="brand">
                {copy.score} {score}
              </Badge>
            ) : null}
            {translated ? (
              <Badge tone="neutral">
                <span className="inline-flex items-center gap-1">
                  <Languages className="h-3 w-3" />
                  {copy.translated}
                </span>
              </Badge>
            ) : pending ? (
              <Badge tone="neutral">
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  …
                </span>
              </Badge>
            ) : null}
          </Cluster>
          <DialogTitle className="text-balance text-xl leading-snug">
            {brief.title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {recap[0]?.teaser ?? brief.tldr}
          </DialogDescription>
        </DialogHeader>

        <Stack gap={3}>
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt=""
              className="aspect-[16/8] w-full rounded-2xl border border-border object-cover"
            />
          ) : null}

          <section>
            <Text
              size="sm"
              weight="medium"
              className="mb-2 uppercase tracking-wide text-muted-foreground"
            >
              {copy.recapTitle}
            </Text>
            <Stack gap={2}>
              {recap.map((point) => (
                <EssentialPointRow
                  key={point.id}
                  point={point}
                  expanded={expandedPoint === point.id}
                  onToggle={() =>
                    setExpandedPoint((current) =>
                      current === point.id ? null : point.id,
                    )
                  }
                />
              ))}
            </Stack>
          </section>

          <section className="rounded-2xl border border-border bg-muted/30 px-4 py-3">
            <Text
              size="sm"
              weight="medium"
              className="uppercase tracking-wide text-muted-foreground"
            >
              {copy.sources}
            </Text>
            <Text size="sm" tone="muted" className="mt-2">
              {copy.published}{" "}
              {localItem.published_at
                ? new Date(localItem.published_at).toLocaleDateString(dateLocale, {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : copy.unknownDate}
              {" · "}
              {localItem.primary_source}
            </Text>
          </section>
        </Stack>

        <DialogFooter className="gap-2 pb-1 sm:justify-between">
          <SaveButton
            itemId={localItem.id}
            saved={Boolean(localItem.saved)}
            locale={locale}
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              window.open(visitUrl, "_blank", "noopener,noreferrer")
            }
          >
            <ExternalLink className="h-4 w-4" />
            {copy.visitSource}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
