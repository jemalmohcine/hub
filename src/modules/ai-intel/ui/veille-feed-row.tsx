"use client";

import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Text } from "@/design-system";
import {
  VEILLE_CATEGORY_LABELS,
  VEILLE_SEVERITY_LABELS,
} from "@/modules/ai-intel/veille/labels";
import type { VeilleItem } from "@/modules/ai-intel/veille/types";
import { cn } from "@/lib/utils";

function Chip({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "danger" | "brand";
}) {
  return (
    <span
      className={cn(
        "rounded-md px-1.5 py-0.5 text-[length:var(--dh-text-2xs)] font-semibold uppercase tracking-wide",
        tone === "danger" &&
          "bg-[var(--dh-danger-soft)] text-[var(--dh-danger)]",
        tone === "brand" && "bg-[var(--dh-brand-soft)] text-[var(--dh-brand)]",
        tone === "muted" && "bg-background/80 text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

export function VeilleFeedRow({
  item,
  onOpen,
}: {
  item: VeilleItem;
  onOpen: (item: VeilleItem) => void;
}) {
  const critical = item.severity === "critique";

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className={cn(
        "mb-1.5 flex w-full items-start gap-3 rounded-2xl border border-transparent px-3 py-3 text-left transition-colors active:scale-[0.995]",
        critical
          ? "border-[var(--dh-danger)]/20 bg-[var(--dh-danger-soft)]/40"
          : "bg-background/70",
        item.saved && "ring-1 ring-[var(--dh-brand)]/15",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="mb-1.5 flex flex-wrap items-center gap-1">
          {critical ? (
            <Chip tone="danger">{VEILLE_SEVERITY_LABELS.critique}</Chip>
          ) : null}
          <Chip tone={item.category === "securite" ? "danger" : "muted"}>
            {VEILLE_CATEGORY_LABELS[item.category]}
          </Chip>
          {item.saved ? <Chip tone="brand">Sauvegardé</Chip> : null}
        </span>
        <Text weight="medium" className="line-clamp-2 text-balance leading-snug">
          {item.title}
        </Text>
        <Text size="sm" tone="muted" className="mt-1 line-clamp-2 leading-snug">
          {item.summary}
        </Text>
      </span>
      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/55" />
    </button>
  );
}
