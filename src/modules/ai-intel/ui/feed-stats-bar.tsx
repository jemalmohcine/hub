"use client";

import type { AiLocale } from "@/modules/ai-intel/i18n/locale";
import { t } from "@/modules/ai-intel/i18n/locale";
import { cn } from "@/lib/utils";

export type FeedTabId = "all" | "urgent" | "github" | "tools" | "news" | "saved";

export function FeedStatsBar({
  counts,
  total,
  activeTab,
  onSelect,
  locale,
}: {
  counts: Record<Exclude<FeedTabId, "all" | "saved">, number>;
  total: number;
  activeTab: FeedTabId;
  onSelect: (tab: FeedTabId) => void;
  locale: AiLocale;
}) {
  const copy = t(locale);

  const stats: Array<{
    id: FeedTabId;
    label: string;
    count: number;
    tone?: "urgent" | "brand" | "neutral";
  }> = [
    { id: "all", label: copy.tabAll, count: total, tone: "brand" },
    { id: "urgent", label: copy.tabUrgent, count: counts.urgent, tone: "urgent" },
    { id: "github", label: copy.tabGithub, count: counts.github },
    { id: "tools", label: copy.tabTools, count: counts.tools },
    { id: "news", label: copy.tabNews, count: counts.news },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {stats.map((stat) => {
        const active = activeTab === stat.id;
        return (
          <button
            key={stat.id}
            type="button"
            onClick={() => onSelect(stat.id)}
            className={cn(
              "rounded-2xl border px-3 py-2.5 text-left transition-colors active:scale-[0.99]",
              active
                ? "border-[var(--dh-brand)]/35 bg-[var(--dh-brand-soft)]/40"
                : "border-border/80 bg-card/60 hover:bg-muted/40",
              stat.tone === "urgent" &&
                stat.count > 0 &&
                !active &&
                "border-[var(--dh-danger)]/25 bg-[var(--dh-danger-soft)]/20",
            )}
          >
            <div
              className={cn(
                "text-xl font-semibold tabular-nums leading-none",
                stat.tone === "urgent" && stat.count > 0
                  ? "text-[var(--dh-danger)]"
                  : "text-foreground",
              )}
            >
              {stat.count}
            </div>
            <div className="mt-1 text-[11px] font-medium text-muted-foreground">
              {stat.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}
