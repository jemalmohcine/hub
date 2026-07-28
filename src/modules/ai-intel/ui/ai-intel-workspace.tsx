"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Bookmark, Search } from "lucide-react";
import {
  Card,
  Cluster,
  Heading,
  Input,
  Stack,
  Text,
} from "@/design-system";
import { FeedItemRow } from "@/modules/ai-intel/ui/feed-item-row";
import { ItemDetailModal } from "@/modules/ai-intel/ui/item-detail-modal";
import {
  DateRangePicker,
  defaultDateRange,
  itemInRange,
  type DateRangeValue,
} from "@/modules/ai-intel/ui/date-range-picker";
import { markAiIntelRead } from "@/modules/ai-intel/actions";
import { detectContentKind } from "@/modules/ai-intel/content-kind";
import {
  isHotAlert,
  isNoise,
  sortForDeveloper,
} from "@/modules/ai-intel/ui/rank";
import type { AiLocale } from "@/modules/ai-intel/i18n/locale";
import { t } from "@/modules/ai-intel/i18n/locale";
import type { AiIntelItem } from "@/modules/ai-intel/types";
import { cn } from "@/lib/utils";

type TabId = "urgent" | "github" | "tools" | "news" | "saved";

function toLocalIsoDay(raw: string | null | undefined): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Date used by the period filter: when it entered the hub. */
function itemDay(item: AiIntelItem): string {
  return toLocalIsoDay(item.ingested_at) || toLocalIsoDay(item.published_at);
}

function matchesTab(item: AiIntelItem, tab: TabId): boolean {
  const kind = detectContentKind(item);
  if (tab === "urgent") return isHotAlert(item);
  // GitHub = repositories only; GitHub product news lands in News
  if (tab === "github") return kind === "repo";
  if (tab === "tools") return kind === "tool";
  if (tab === "news") return kind !== "repo" && kind !== "tool";
  if (tab === "saved") return Boolean(item.saved);
  return false;
}

export function AiIntelWorkspace({
  initialItems,
  digestLabel,
  initialLocale = "fr",
}: {
  initialItems: AiIntelItem[];
  digestLabel: string | null;
  initialLocale?: AiLocale;
}) {
  const locale = initialLocale;
  const copy = t(locale);
  const [tab, setTab] = useState<TabId>("urgent");
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeValue>(defaultDateRange);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [items, setItems] = useState(initialItems);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const tabs: { id: TabId; label: string }[] = [
    { id: "urgent", label: copy.tabUrgent },
    { id: "github", label: copy.tabGithub },
    { id: "tools", label: copy.tabTools },
    { id: "news", label: copy.tabNews },
    { id: "saved", label: copy.tabSaved },
  ];

  const datedItems = useMemo(() => {
    return items.filter((item) => itemInRange(itemDay(item), dateRange));
  }, [items, dateRange]);

  const visiblePool = useMemo(() => {
    const pool = datedItems.filter(
      (i) => !isNoise(i) || isHotAlert(i) || i.saved,
    );
    return [...pool].sort(sortForDeveloper);
  }, [datedItems]);

  const counts = useMemo(() => {
    const base: Record<TabId, number> = {
      urgent: 0,
      github: 0,
      tools: 0,
      news: 0,
      saved: 0,
    };
    for (const item of visiblePool) {
      if (matchesTab(item, "urgent")) base.urgent += 1;
      if (matchesTab(item, "github")) base.github += 1;
      if (matchesTab(item, "tools")) base.tools += 1;
      if (matchesTab(item, "news")) base.news += 1;
      if (item.saved) base.saved += 1;
    }
    return base;
  }, [visiblePool]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return visiblePool.filter((item) => {
      if (!matchesTab(item, tab)) return false;
      if (
        query &&
        !`${item.title} ${item.summary}`.toLowerCase().includes(query)
      ) {
        return false;
      }
      return true;
    });
  }, [visiblePool, tab, q]);

  const selected =
    selectedId != null
      ? (items.find((i) => i.id === selectedId) ?? null)
      : null;

  function openItem(item: AiIntelItem) {
    setSelectedId(item.id);
    if (item.read) return;
    setItems((prev) =>
      prev.map((x) => (x.id === item.id ? { ...x, read: true } : x)),
    );
    startTransition(async () => {
      try {
        await markAiIntelRead(item.id);
      } catch {
        // Migration may not be applied yet; optimistic UI still marks as read
      }
    });
  }

  return (
    <Stack gap={4}>
      <Cluster gap={2} className="w-full items-center justify-between">
        <Text size="sm" tone="muted" className="min-w-0 truncate">
          {digestLabel || copy.digestEmpty}
        </Text>
        <Cluster gap={1} className="shrink-0">
          <button
            type="button"
            aria-label={copy.search}
            aria-pressed={searchOpen}
            onClick={() => setSearchOpen((v) => !v)}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-xl",
              searchOpen
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground",
            )}
          >
            <Search className="h-4 w-4" />
          </button>
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            locale={locale}
          />
        </Cluster>
      </Cluster>

      {searchOpen ? (
        <Input
          aria-label={copy.search}
          placeholder={copy.search}
          value={q}
          autoFocus
          onChange={(e) => setQ(e.target.value)}
        />
      ) : null}

      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tabItem) => {
          const active = tab === tabItem.id;
          const unreadInTab = visiblePool.filter(
            (i) => matchesTab(i, tabItem.id) && !i.read,
          ).length;
          return (
            <button
              key={tabItem.id}
              type="button"
              onClick={() => setTab(tabItem.id)}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors",
                active
                  ? "bg-foreground text-background"
                  : "bg-muted/80 text-muted-foreground",
              )}
            >
              {tabItem.id === "saved" ? (
                <Bookmark className="h-3.5 w-3.5" />
              ) : null}
              {tabItem.label}
              <span
                className={cn(
                  "tabular-nums text-[11px]",
                  active ? "opacity-70" : "opacity-50",
                )}
              >
                {counts[tabItem.id]}
              </span>
              {unreadInTab > 0 && tabItem.id !== "saved" ? (
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    active ? "bg-background/80" : "bg-[var(--dh-brand)]",
                  )}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-6">
          <Heading level={3}>
            {tab === "urgent" ? copy.emptyUrgent : copy.noData}
          </Heading>
          <Text size="sm" tone="muted" className="mt-1">
            {tab === "urgent" ? copy.emptyUrgentHint : copy.emptyHint}
          </Text>
        </Card>
      ) : (
        <Stack gap={1}>
          {filtered.map((item) => (
            <FeedItemRow
              key={item.id}
              item={item}
              locale={locale}
              onOpen={openItem}
            />
          ))}
        </Stack>
      )}

      <ItemDetailModal
        item={selected}
        open={selectedId != null}
        locale={locale}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        onMetadataUpdate={(id, metadata) => {
          setItems((prev) =>
            prev.map((x) => (x.id === id ? { ...x, metadata } : x)),
          );
        }}
      />
    </Stack>
  );
}
