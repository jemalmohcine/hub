"use client";

import { ChevronRight } from "lucide-react";
import { Badge, Card, Cluster, Text } from "@/design-system";
import { formatStars } from "@/modules/ai-intel/score";
import { urgencyTone } from "@/modules/ai-intel/ui/urgency";
import { readMetaString, verdictTone } from "@/modules/ai-intel/ui/verdict";
import {
  URGENCY_LABELS,
  type AiIntelItem,
} from "@/modules/ai-intel/types";
import { cn } from "@/lib/utils";

function prettyCount(value: string | null): string | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? formatStars(n) : value;
}

export function FeedItemRow({
  item,
  onOpen,
}: {
  item: AiIntelItem;
  onOpen: (item: AiIntelItem) => void;
}) {
  const meta = (item.metadata ?? {}) as Record<string, unknown>;
  const verdictLabel = readMetaString(meta, "verdictLabel");
  const takeaway = readMetaString(meta, "takeaway") || item.summary;
  const score = readMetaString(meta, "score");
  const stars = prettyCount(readMetaString(meta, "stars"));
  const starsToday = prettyCount(readMetaString(meta, "starsToday"));
  const pricing = readMetaString(meta, "pricing");

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="w-full text-left"
    >
      <Card
        interactive
        className={cn(
          "p-[var(--dh-space-3)] transition-colors sm:p-[var(--dh-space-4)]",
          item.urgency === "urgent" && "ring-1 ring-[var(--dh-danger)]/25",
        )}
      >
        <Cluster gap={3} align="start" className="w-full">
          <div className="min-w-0 flex-1">
            <Cluster gap={2} className="mb-2 flex-wrap">
              {verdictLabel ? (
                <Badge tone={verdictTone(meta.verdict)}>{verdictLabel}</Badge>
              ) : (
                <Badge tone={urgencyTone[item.urgency]}>
                  {URGENCY_LABELS[item.urgency]}
                </Badge>
              )}
              {score ? <Badge tone="brand">Score {score}</Badge> : null}
              {stars ? <Badge tone="info">{stars}★</Badge> : null}
              {starsToday ? (
                <Badge tone="warning">+{starsToday}/j</Badge>
              ) : null}
              {pricing ? <Badge tone="neutral">{pricing}</Badge> : null}
              {item.saved ? <Badge tone="brand">Sauvé</Badge> : null}
            </Cluster>
            <Text weight="medium" className="line-clamp-2 leading-snug">
              {item.title}
            </Text>
            {takeaway ? (
              <Text size="sm" tone="muted" className="mt-1 line-clamp-2">
                {takeaway}
              </Text>
            ) : null}
            <Text size="sm" tone="muted" className="mt-2">
              {item.primary_source}
              {item.published_at
                ? ` · ${new Date(item.published_at).toLocaleDateString("fr-FR")}`
                : ""}
            </Text>
          </div>
          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
        </Cluster>
      </Card>
    </button>
  );
}
