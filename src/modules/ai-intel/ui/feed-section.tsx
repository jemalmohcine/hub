"use client";

import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Text } from "@/design-system";
import { cn } from "@/lib/utils";

export function FeedSection({
  title,
  count,
  description,
  onViewAll,
  viewAllLabel,
  tone = "neutral",
  children,
}: {
  title: string;
  count: number;
  description?: string;
  onViewAll?: () => void;
  viewAllLabel?: string;
  tone?: "urgent" | "neutral";
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-3xl border",
        tone === "urgent"
          ? "border-[var(--dh-danger)]/20 bg-[var(--dh-danger-soft)]/10"
          : "border-border/80 bg-card/40",
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border/60 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Text weight="medium" className="text-[15px]">
              {title}
            </Text>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
              {count}
            </span>
          </div>
          {description ? (
            <Text size="sm" tone="muted" className="mt-0.5 leading-snug">
              {description}
            </Text>
          ) : null}
        </div>
        {onViewAll && viewAllLabel ? (
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-[var(--dh-brand)]"
          >
            {viewAllLabel}
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
      <div className="p-2">{children}</div>
    </section>
  );
}
