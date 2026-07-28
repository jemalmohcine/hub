"use client";

import { ExternalLink, Globe } from "lucide-react";
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
import { formatStars } from "@/modules/ai-intel/score";
import { urgencyTone } from "@/modules/ai-intel/ui/urgency";
import { readMetaString, verdictTone } from "@/modules/ai-intel/ui/verdict";
import {
  PILLAR_LABELS,
  URGENCY_LABELS,
  type AiIntelItem,
} from "@/modules/ai-intel/types";

function metaTags(meta: Record<string, unknown>): string[] {
  const tags = meta.tags;
  if (!Array.isArray(tags)) return [];
  return tags.filter((t): t is string => typeof t === "string" && t.length > 0);
}

function metaReasons(meta: Record<string, unknown>): string[] {
  const reasons = meta.scoreReasons;
  if (!Array.isArray(reasons)) return [];
  return reasons.filter((t): t is string => typeof t === "string" && t.length > 0);
}

function websiteHref(website: string | null): string | null {
  if (!website) return null;
  return website.startsWith("http") ? website : `https://${website}`;
}

export function ItemDetailModal({
  item,
  open,
  onOpenChange,
}: {
  item: AiIntelItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!item) return null;

  const refs = Array.isArray(item.source_refs) ? item.source_refs : [];
  const confirmations = refs.length + 1;
  const meta = (item.metadata ?? {}) as Record<string, unknown>;
  const about = readMetaString(meta, "about") || readMetaString(meta, "description");
  const tagline = readMetaString(meta, "tagline");
  const pricing = readMetaString(meta, "pricing");
  const upvotes = readMetaString(meta, "upvotes");
  const website = readMetaString(meta, "website");
  const listed = readMetaString(meta, "listed");
  const api = readMetaString(meta, "api");
  const openSource = readMetaString(meta, "openSource");
  const image = readMetaString(meta, "image");
  const language = readMetaString(meta, "language");
  const categoryLabel = readMetaString(meta, "categoryLabel");
  const starsRaw = readMetaString(meta, "stars");
  const starsTodayRaw = readMetaString(meta, "starsToday");
  const forksRaw = readMetaString(meta, "forks");
  const score = readMetaString(meta, "score");
  const verdictLabel = readMetaString(meta, "verdictLabel");
  const takeaway = readMetaString(meta, "takeaway");
  const mattsPick = meta.mattsPick === true;
  const tags = metaTags(meta);
  const reasons = metaReasons(meta);
  const visitUrl = websiteHref(website) || item.url;
  const isToolish =
    item.pillar === "tools" ||
    meta.provider === "futuretools" ||
    Boolean(website || pricing || upvotes);

  const stars =
    starsRaw && Number(starsRaw)
      ? formatStars(Number(starsRaw))
      : starsRaw;
  const starsToday =
    starsTodayRaw && Number(starsTodayRaw)
      ? formatStars(Number(starsTodayRaw))
      : starsTodayRaw;
  const forks =
    forksRaw && Number(forksRaw) ? formatStars(Number(forksRaw)) : forksRaw;

  const glanceEntries = [
    stars ? { label: "Stars", value: stars } : null,
    starsToday ? { label: "Stars today", value: `+${starsToday}` } : null,
    forks ? { label: "Forks", value: forks } : null,
    language ? { label: "Langage", value: language } : null,
    pricing ? { label: "Prix", value: pricing } : null,
    upvotes ? { label: "Upvotes", value: upvotes } : null,
    categoryLabel ? { label: "Catégorie", value: categoryLabel } : null,
    listed ? { label: "Listé depuis", value: listed } : null,
    api ? { label: "API", value: api } : null,
    openSource ? { label: "Open source", value: openSource } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <Cluster gap={2} className="mb-2 flex-wrap">
            {verdictLabel ? (
              <Badge tone={verdictTone(meta.verdict)}>{verdictLabel}</Badge>
            ) : null}
            {score ? <Badge tone="brand">Score {score}/100</Badge> : null}
            <Badge tone="brand">{PILLAR_LABELS[item.pillar]}</Badge>
            <Badge tone={urgencyTone[item.urgency]}>
              {URGENCY_LABELS[item.urgency]}
            </Badge>
            {mattsPick ? <Badge tone="warning">Matt&apos;s Pick</Badge> : null}
            {confirmations > 1 ? (
              <Badge tone="success">Confirmé · {confirmations} sources</Badge>
            ) : null}
          </Cluster>
          <DialogTitle className="text-balance text-xl sm:text-2xl">
            {item.title}
          </DialogTitle>
          <DialogDescription className="mt-2 text-base leading-relaxed">
            {takeaway || tagline || about?.slice(0, 280) || item.summary}
          </DialogDescription>
        </DialogHeader>

        <Stack gap={4}>
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt=""
              className="aspect-[16/7] w-full rounded-2xl border border-border object-cover"
            />
          ) : null}

          {reasons.length > 0 ? (
            <div className="rounded-2xl border border-[var(--dh-brand)]/25 bg-[var(--dh-brand-soft)]/40 px-4 py-3">
              <Text size="sm" weight="medium">
                Pourquoi ce score
              </Text>
              <ul className="mt-2 list-disc space-y-1.5 pl-4">
                {reasons.map((reason) => (
                  <li key={reason}>
                    <Text size="sm" tone="muted">
                      {reason}
                    </Text>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {about && about !== takeaway && about !== tagline ? (
            <div>
              <Text size="sm" weight="medium" className="mb-2">
                {isToolish ? "À propos" : "Détail"}
              </Text>
              <Text size="sm" tone="muted" className="leading-relaxed whitespace-pre-wrap">
                {about}
              </Text>
            </div>
          ) : null}

          {glanceEntries.length > 0 ? (
            <div>
              <Text size="sm" weight="medium" className="mb-2">
                {isToolish ? "En un coup d’œil" : "Infos clés"}
              </Text>
              <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-muted/35 px-4 py-3 sm:grid-cols-3">
                {glanceEntries.map((entry) => (
                  <div key={entry.label}>
                    <Text size="sm" tone="muted">
                      {entry.label}
                    </Text>
                    <Text size="sm" weight="medium" className="mt-0.5">
                      {entry.value}
                    </Text>
                  </div>
                ))}
                {website ? (
                  <div className="col-span-2 sm:col-span-3">
                    <Text size="sm" tone="muted">
                      Site officiel
                    </Text>
                    <a
                      href={websiteHref(website)!}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--dh-brand)] hover:underline"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      {website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {tags.length > 0 ? (
            <Cluster gap={2} className="flex-wrap">
              {tags.map((tag) => (
                <Badge key={tag} tone="neutral">
                  {tag}
                </Badge>
              ))}
            </Cluster>
          ) : null}

          <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3">
            <Text size="sm" weight="medium">
              Sources
            </Text>
            <ul className="mt-2 space-y-1.5">
              <li>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-[var(--dh-brand)] hover:underline"
                >
                  {item.primary_source}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </li>
              {refs.map((ref) => (
                <li key={`${ref.sourceId}-${ref.url}`}>
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {ref.sourceId}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <Cluster gap={3} className="flex-wrap">
            <Text size="sm" tone="muted">
              Publié{" "}
              {item.published_at
                ? new Date(item.published_at).toLocaleString("fr-FR")
                : "date inconnue"}
            </Text>
            <Text size="sm" tone="muted">
              Ajouté {new Date(item.ingested_at).toLocaleString("fr-FR")}
            </Text>
          </Cluster>
        </Stack>

        <DialogFooter className="gap-2 sm:justify-between">
          <SaveButton itemId={item.id} saved={Boolean(item.saved)} />
          <Button
            size="sm"
            onClick={() =>
              window.open(visitUrl, "_blank", "noopener,noreferrer")
            }
          >
            <ExternalLink className="h-4 w-4" />
            {website ? "Visiter le site" : "Ouvrir la source"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
