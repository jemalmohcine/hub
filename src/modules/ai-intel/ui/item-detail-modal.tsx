"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, Check, ExternalLink, Languages, Loader2 } from "lucide-react";
import {
  Badge,
  Button,
  Cluster,
  Dialog,
  Stack,
  Text,
  useAsyncAction,
} from "@/design-system";
import { cn } from "@/design-system/lib/cn";
import { SaveButton } from "@/modules/ai-intel/ui/save-button";
import { ensureItemTranslation } from "@/modules/ai-intel/actions-i18n";
import { getItemI18n } from "@/modules/ai-intel/brief";
import {
  contentKindLabel,
  contentKindTone,
  detectContentKind,
} from "@/modules/ai-intel/content-kind";
import { buildItemDetail, type DetailSection } from "@/modules/ai-intel/item-detail";
import type { HubLocale } from "@/core/i18n";
import { formatDate } from "@/lib/dates";
import { t } from "@/modules/ai-intel/i18n/locale";
import { sourceDisplayName } from "@/modules/ai-intel/source-label";
import { isHotAlert, itemTags } from "@/modules/ai-intel/ui/rank";
import { readMetaString, verdictTone } from "@/modules/ai-intel/ui/verdict";
import { type AiIntelItem } from "@/modules/ai-intel/types";

function websiteHref(website: string | null): string | null {
  if (!website) return null;
  return website.startsWith("http") ? website : `https://${website}`;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <Text
        size="sm"
        weight="medium"
        className="mb-2 uppercase tracking-wide text-muted-foreground"
      >
        {title}
      </Text>
      {children}
    </section>
  );
}

/** Long text folds to a few lines with a toggle, so nothing is silently cut. */
function Prose({
  text,
  collapsible,
  className,
  moreLabel,
  lessLabel,
}: {
  text: string;
  collapsible: boolean;
  className?: string;
  moreLabel: string;
  lessLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const folded = collapsible && !expanded;

  return (
    <div>
      <Text
        size="sm"
        className={cn(
          "leading-relaxed break-words whitespace-pre-line",
          folded && "line-clamp-6",
          className,
        )}
      >
        {text}
      </Text>
      {collapsible ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-1.5 inline-flex items-center gap-1 text-[length:var(--dh-text-sm)] font-medium text-[var(--dh-brand)] hover:underline focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {expanded ? lessLabel : moreLabel}
          <ChevronDown
            className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")}
            aria-hidden
          />
        </button>
      ) : null}
    </div>
  );
}

function DetailBlock({
  section,
  moreLabel,
  lessLabel,
}: {
  section: DetailSection;
  moreLabel: string;
  lessLabel: string;
}) {
  if (section.kind === "bullets") {
    return (
      <Section title={section.label}>
        <ul className="space-y-2">
          {section.items.map((point) => (
            <li key={point} className="flex gap-2.5">
              <span
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--dh-brand)]"
                aria-hidden
              />
              <Text size="sm" className="leading-relaxed break-words">
                {point}
              </Text>
            </li>
          ))}
        </ul>
      </Section>
    );
  }

  if (section.kind === "facts") {
    return (
      <Section title={section.label}>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
          {section.facts.map((fact) => (
            <div key={`${fact.label}-${fact.value}`} className="min-w-0">
              <Text
                as="span"
                size="2xs"
                tone="muted"
                className="block uppercase tracking-wide"
              >
                {fact.label}
              </Text>
              <Text as="span" size="sm" className="block break-words">
                {fact.value}
              </Text>
            </div>
          ))}
        </dl>
      </Section>
    );
  }

  return (
    <Section title={section.label}>
      <Prose
        text={section.text}
        collapsible={section.collapsible}
        moreLabel={moreLabel}
        lessLabel={lessLabel}
        className={cn(
          section.boxed &&
            "rounded-2xl border border-border bg-muted/30 px-4 py-3",
          section.muted && "text-muted-foreground",
        )}
      />
    </Section>
  );
}

export function ItemDetailModal({
  item,
  open,
  locale,
  onOpenChange,
  onMetadataUpdate,
  onSavedChange,
  onTreatedChange,
}: {
  item: AiIntelItem | null;
  open: boolean;
  locale: HubLocale;
  onOpenChange: (open: boolean) => void;
  onMetadataUpdate?: (
    itemId: string,
    metadata: Record<string, unknown>,
  ) => void;
  onSavedChange?: (itemId: string, saved: boolean) => void;
  onTreatedChange?: (itemId: string, treated: boolean) => void;
}) {
  if (!item) return null;

  return (
    <ItemDetailModalBody
      key={item.id}
      item={item}
      open={open}
      locale={locale}
      onOpenChange={onOpenChange}
      onMetadataUpdate={onMetadataUpdate}
      onSavedChange={onSavedChange}
      onTreatedChange={onTreatedChange}
    />
  );
}

function ItemDetailModalBody({
  item,
  open,
  locale,
  onOpenChange,
  onMetadataUpdate,
  onSavedChange,
  onTreatedChange,
}: {
  item: AiIntelItem;
  open: boolean;
  locale: HubLocale;
  onOpenChange: (open: boolean) => void;
  onMetadataUpdate?: (
    itemId: string,
    metadata: Record<string, unknown>,
  ) => void;
  onSavedChange?: (itemId: string, saved: boolean) => void;
  onTreatedChange?: (itemId: string, treated: boolean) => void;
}) {
  const copy = t(locale);
  const { run, pending } = useAsyncAction();
  const [localItem, setLocalItem] = useState(item);

  useEffect(() => {
    setLocalItem(item);
  }, [item]);

  useEffect(() => {
    if (!open) return;
    const i18n = getItemI18n((item.metadata ?? {}) as Record<string, unknown>);
    if (i18n?.translatedAt) return;

    void run(
      async () => {
        const translatedMeta = await ensureItemTranslation(item.id);
        setLocalItem((prev) =>
          prev
            ? { ...prev, metadata: translatedMeta as Record<string, unknown> }
            : prev,
        );
        onMetadataUpdate?.(item.id, translatedMeta as Record<string, unknown>);
      },
      {
        silent: true,
        onError: () => {
          /* keep original language */
        },
      },
    );
  }, [open, item, run, onMetadataUpdate]);

  const meta = (localItem.metadata ?? {}) as Record<string, unknown>;
  const detail = buildItemDetail(localItem, locale);
  const i18n = getItemI18n(meta);
  const tags = itemTags(localItem);
  const website = readMetaString(meta, "website");
  const image = readMetaString(meta, "image");
  const verdictLabel =
    (locale === "fr" ? i18n?.verdictLabel?.fr : i18n?.verdictLabel?.en) ||
    readMetaString(meta, "verdictLabel");
  const visitUrl = websiteHref(website) || localItem.url;
  const translated = Boolean(i18n?.translatedAt);

  const kind = detectContentKind(localItem);
  const kindTone = contentKindTone(kind);
  const kindBadgeTone =
    kindTone === "urgent"
      ? ("danger" as const)
      : kindTone === "ok"
        ? ("success" as const)
        : kindTone === "warn"
          ? ("warning" as const)
          : ("neutral" as const);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={<span className="text-balance leading-snug">{detail.title}</span>}
      description={detail.summary}
      srOnlyDescription
      headerAbove={
        <Cluster gap={2} className="mb-1 flex-wrap">
          {isHotAlert(localItem) ? (
            <Badge tone="danger">{copy.urgent}</Badge>
          ) : null}
          {localItem.read ? (
            <Badge tone="success">{copy.treated}</Badge>
          ) : null}
          <Badge tone={kindBadgeTone}>{contentKindLabel(kind, locale)}</Badge>
          {tags.map((tag) => (
            <Badge key={tag} tone="neutral">
              {tag}
            </Badge>
          ))}
          {verdictLabel ? (
            <Badge tone={verdictTone(meta.verdict)}>{verdictLabel}</Badge>
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
                <Loader2 className="h-3 w-3 animate-spin" />…
              </span>
            </Badge>
          ) : null}
        </Cluster>
      }
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <SaveButton
            itemId={localItem.id}
            saved={Boolean(localItem.saved)}
            locale={locale}
            onSavedChange={(saved) => {
              setLocalItem((prev) => ({ ...prev, saved }));
              onSavedChange?.(localItem.id, saved);
            }}
          />
          <Cluster gap={2}>
            <Button
              size="sm"
              variant={localItem.read ? "secondary" : "primary"}
              onClick={() => {
                const next = !localItem.read;
                setLocalItem((prev) => ({ ...prev, read: next }));
                onTreatedChange?.(localItem.id, next);
              }}
            >
              <Check className="h-4 w-4" />
              {localItem.read ? copy.treated : copy.markTreated}
            </Button>
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
          </Cluster>
        </div>
      }
    >
      <Stack gap={4}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            className="aspect-[16/8] w-full rounded-2xl border border-border object-cover"
          />
        ) : null}

        {detail.sections.map((section) => (
          <DetailBlock
            key={section.id}
            section={section}
            moreLabel={copy.readMore}
            lessLabel={copy.readLess}
          />
        ))}

        <Section title={copy.sources}>
          <Text size="sm" tone="muted">
            {copy.published}{" "}
            {formatDate(localItem.published_at, locale, "dayMonthYear") ||
              copy.unknownDate}
            {" · "}
            {sourceDisplayName(localItem.primary_source)}
          </Text>
        </Section>
      </Stack>
    </Dialog>
  );
}
