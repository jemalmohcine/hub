"use client";

import { useEffect, useState, useTransition } from "react";
import { ExternalLink, Languages } from "lucide-react";
import {
  Badge,
  Button,
  Cluster,
  Stack,
  Text,
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
import {
  getItemI18n,
  resolveBrief,
} from "@/modules/ai-intel/brief";
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
  const [pending, startTransition] = useTransition();
  const [localItem, setLocalItem] = useState(item);

  useEffect(() => {
    setLocalItem(item);
  }, [item]);

  useEffect(() => {
    if (!open || !localItem) return;
    const i18n = getItemI18n((localItem.metadata ?? {}) as Record<string, unknown>);
    if (i18n?.translatedAt) return;

    startTransition(async () => {
      try {
        const meta = await ensureItemTranslation(localItem.id);
        setLocalItem((prev) =>
          prev ? { ...prev, metadata: meta as Record<string, unknown> } : prev,
        );
        onMetadataUpdate?.(localItem.id, meta as Record<string, unknown>);
      } catch {
        // keep original language if translation fails
      }
    });
  }, [open, localItem?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!localItem) return null;

  const meta = (localItem.metadata ?? {}) as Record<string, unknown>;
  const brief = resolveBrief(localItem, locale);
  const i18n = getItemI18n(meta);
  const about =
    (locale === "fr" ? i18n?.about?.fr : i18n?.about?.en) ||
    readMetaString(meta, "about") ||
    readMetaString(meta, "description");
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
  const contextLine = [
    brief.product,
    brief.name !== brief.title ? brief.name : null,
    localItem.primary_source,
  ]
    .filter(Boolean)
    .filter((part, idx, arr) => arr.indexOf(part) === idx)
    .join(" · ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
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
              <Badge tone="neutral">…</Badge>
            ) : null}
          </Cluster>
          <DialogTitle className="text-balance text-xl leading-snug">
            {brief.title}
          </DialogTitle>
          {contextLine ? (
            <Text size="sm" tone="muted" className="mt-1">
              {contextLine}
            </Text>
          ) : null}
          <DialogDescription className="sr-only">
            {brief.tldr}
          </DialogDescription>
        </DialogHeader>

        <Stack gap={4}>
          {brief.tldr ? (
            <section className="rounded-2xl border border-[var(--dh-brand)]/20 bg-[var(--dh-brand-soft)]/35 px-4 py-3">
              <Text size="sm" weight="medium" className="uppercase tracking-wide text-muted-foreground">
                {copy.tldr}
              </Text>
              <Text className="mt-1.5 leading-relaxed">{brief.tldr}</Text>
            </section>
          ) : null}

          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt=""
              className="aspect-[16/8] w-full rounded-2xl border border-border object-cover"
            />
          ) : null}

          {brief.facts.length > 0 ? (
            <section>
              <Text size="sm" weight="medium" className="mb-2 uppercase tracking-wide text-muted-foreground">
                {copy.facts}
              </Text>
              <div className="grid grid-cols-2 gap-2">
                {brief.facts.map((f) => (
                  <div
                    key={`${f.label}-${f.value}`}
                    className="rounded-xl bg-muted/35 px-3 py-2.5"
                  >
                    <Text size="sm" tone="muted">
                      {f.label}
                    </Text>
                    <Text size="sm" weight="medium" className="mt-0.5">
                      {f.value}
                    </Text>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {brief.why.length > 0 ? (
            <section>
              <Text size="sm" weight="medium" className="mb-2 uppercase tracking-wide text-muted-foreground">
                {copy.why}
              </Text>
              <ul className="space-y-2">
                {brief.why.map((line, index) => (
                  <li
                    key={`${index}-${line}`}
                    className="rounded-xl bg-muted/40 px-3 py-2 text-sm leading-relaxed"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {about && about !== brief.tldr ? (
            <section>
              <Text size="sm" weight="medium" className="mb-2 uppercase tracking-wide text-muted-foreground">
                {copy.detail}
              </Text>
              <Text size="sm" tone="muted" className="leading-relaxed whitespace-pre-wrap">
                {about.slice(0, 900)}
              </Text>
            </section>
          ) : null}

          <section className="rounded-2xl border border-border bg-muted/30 px-4 py-3">
            <Text size="sm" weight="medium" className="uppercase tracking-wide text-muted-foreground">
              {copy.sources}
            </Text>
            <a
              href={localItem.url}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--dh-brand)] hover:underline",
              )}
            >
              {localItem.primary_source}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <Text size="sm" tone="muted" className="mt-2">
              {copy.published}{" "}
              {localItem.published_at
                ? new Date(localItem.published_at).toLocaleString(dateLocale, {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : copy.unknownDate}
              {" · "}
              {copy.added}{" "}
              {new Date(localItem.ingested_at).toLocaleString(dateLocale, {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </section>
        </Stack>

        <DialogFooter className="gap-2 sm:justify-between">
          <SaveButton
            itemId={localItem.id}
            saved={Boolean(localItem.saved)}
            locale={locale}
          />
          <Button
            size="sm"
            onClick={() =>
              window.open(visitUrl, "_blank", "noopener,noreferrer")
            }
          >
            <ExternalLink className="h-4 w-4" />
            {website ? copy.visitSite : copy.visit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
