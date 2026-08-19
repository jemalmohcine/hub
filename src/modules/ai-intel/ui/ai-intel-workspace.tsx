"use client";

import { useEffect, useMemo, useState } from "react";
import { Bookmark, Search } from "lucide-react";
import {
  EmptyState,
  Input,
  Stack,
  Text,
  useAsyncAction,
} from "@/design-system";
import { FeedItemRow } from "@/modules/ai-intel/ui/feed-item-row";
import { FeedSection } from "@/modules/ai-intel/ui/feed-section";
import {
  FeedStatsBar,
  type FeedTabId,
} from "@/modules/ai-intel/ui/feed-stats-bar";
import { ItemDetailModal } from "@/modules/ai-intel/ui/item-detail-modal";
import {
  DateRangePicker,
  DateRangeQuickPills,
  itemInRange,
  rangeForPreset,
  type DateRangeValue,
} from "@/modules/ai-intel/ui/date-range-picker";
import { markAiIntelRead, setAiIntelTreated } from "@/modules/ai-intel/actions";
import { ensureItemTranslation } from "@/modules/ai-intel/actions-i18n";
import { getItemI18n } from "@/modules/ai-intel/brief";
import { detectContentKind } from "@/modules/ai-intel/content-kind";
import {
  isHotAlert,
  isNoise,
  sortForDeveloper,
} from "@/modules/ai-intel/ui/rank";
import type { HubLocale } from "@/core/i18n";
import { t } from "@/modules/ai-intel/i18n/locale";
import type { AiIntelItem } from "@/modules/ai-intel/types";
import { itemFeedDay } from "@/modules/ai-intel/item-timestamps";
import { parseAiFeedPeriod, parseAiFeedTab } from "@/modules/ai-intel/item-link";
import { cn } from "@/lib/utils";

type TabId = FeedTabId;

const SECTION_LIMITS = {
  github: 5,
  read: 8,
} as const;

/** Period follows the date on the card, not the last scrape. */
function itemInPeriod(item: AiIntelItem, range: DateRangeValue): boolean {
  return itemInRange(itemFeedDay(item), range);
}

function matchesTab(item: AiIntelItem, tab: TabId): boolean {
  if (tab === "all") return true;
  const kind = detectContentKind(item);
  if (tab === "urgent") return isHotAlert(item) && !item.read;
  if (tab === "github") return kind === "repo";
  if (tab === "tools") return kind === "tool";
  if (tab === "news") return kind !== "repo" && kind !== "tool";
  if (tab === "saved") return Boolean(item.saved);
  return false;
}

function filterByQuery(items: AiIntelItem[], query: string): AiIntelItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) =>
    `${item.title} ${item.summary}`.toLowerCase().includes(q),
  );
}

export function AiIntelWorkspace({
  initialItems,
  initialLocale = "fr",
  deepLinkItemId = null,
  deepLinkCanonicalKey = null,
  initialTab = null,
  initialPeriod = null,
}: {
  initialItems: AiIntelItem[];
  initialLocale?: HubLocale;
  deepLinkItemId?: string | null;
  deepLinkCanonicalKey?: string | null;
  initialTab?: string | null;
  initialPeriod?: string | null;
}) {
  const locale = initialLocale;
  const copy = t(locale);
  const [tab, setTab] = useState<TabId>(() => parseAiFeedTab(initialTab));
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeValue>(() => {
    const preset = parseAiFeedPeriod(initialPeriod);
    return { preset, ...rangeForPreset(preset) };
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [items, setItems] = useState(initialItems);
  const { run } = useAsyncAction();

  useEffect(() => {
    const targetId =
      deepLinkItemId ??
      (deepLinkCanonicalKey
        ? initialItems.find((i) => i.canonical_key === deepLinkCanonicalKey)?.id
        : null);
    if (!targetId) return;

    const found = initialItems.find((i) => i.id === targetId);
    if (!found) return;

    setSelectedId(found.id);
    if (!found.read) {
      setItems((prev) =>
        prev.map((x) => (x.id === found.id ? { ...x, read: true } : x)),
      );
      void run(() => markAiIntelRead(found.id), { silent: true });
    }

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("item");
      url.searchParams.delete("key");
      const next = `${url.pathname}${url.search}`;
      window.history.replaceState({}, "", next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open once from URL on mount
  }, []);

  useEffect(() => {
    if (locale !== "fr") return;

    const pending = initialItems
      .filter((item) => !getItemI18n(item.metadata)?.translatedAt)
      .slice(0, 12);
    if (pending.length === 0) return;

    let cancelled = false;

    (async () => {
      for (const item of pending) {
        if (cancelled) return;
        try {
          const meta = await ensureItemTranslation(item.id);
          if (cancelled) return;
          setItems((prev) =>
            prev.map((x) =>
              x.id === item.id
                ? {
                    ...x,
                    metadata: meta as Record<string, unknown>,
                    summary:
                      typeof meta.takeaway === "string"
                        ? String(meta.takeaway).slice(0, 220)
                        : x.summary,
                  }
                : x,
            ),
          );
        } catch {
          // keep original row if translation fails
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [locale, initialItems]);

  const datedItems = useMemo(() => {
    return items.filter((item) => itemInPeriod(item, dateRange));
  }, [items, dateRange]);

  const visiblePool = useMemo(() => {
    const pool = datedItems.filter(
      (i) => !isNoise(i) || isHotAlert(i) || i.saved,
    );
    return [...pool].sort(sortForDeveloper);
  }, [datedItems]);

  const searchedPool = useMemo(
    () => filterByQuery(visiblePool, q),
    [visiblePool, q],
  );

  const counts = useMemo(() => {
    const base = { urgent: 0, github: 0, tools: 0, news: 0, saved: 0 };
    for (const item of visiblePool) {
      if (matchesTab(item, "urgent")) base.urgent += 1;
      if (matchesTab(item, "github")) base.github += 1;
      if (matchesTab(item, "tools")) base.tools += 1;
      if (matchesTab(item, "news")) base.news += 1;
      if (item.saved) base.saved += 1;
    }
    return base;
  }, [visiblePool]);

  const sections = useMemo(() => {
    const urgent = searchedPool.filter((i) => isHotAlert(i));
    const github = searchedPool.filter(
      (i) => matchesTab(i, "github") && !isHotAlert(i),
    );
    const read = searchedPool.filter(
      (i) => !isHotAlert(i) && !matchesTab(i, "github"),
    );
    return { urgent, github, read };
  }, [searchedPool]);

  const filtered = useMemo(() => {
    return searchedPool.filter((item) => matchesTab(item, tab));
  }, [searchedPool, tab]);

  const savedUnread = useMemo(
    () => visiblePool.filter((i) => i.saved && !i.read).length,
    [visiblePool],
  );

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
    void run(() => markAiIntelRead(item.id), { silent: true });
  }

  function handleSavedChange(itemId: string, saved: boolean) {
    setItems((prev) =>
      prev.map((x) => (x.id === itemId ? { ...x, saved } : x)),
    );
  }

  function handleTreatedChange(itemId: string, treated: boolean) {
    setItems((prev) =>
      prev.map((x) => (x.id === itemId ? { ...x, read: treated } : x)),
    );
    void run(() => setAiIntelTreated(itemId, treated), { silent: true });
  }

  function renderItems(list: AiIntelItem[], compact = false) {
    return list.map((item) => (
      <FeedItemRow
        key={item.id}
        item={item}
        locale={locale}
        onOpen={openItem}
        onToggleTreated={() => handleTreatedChange(item.id, !item.read)}
        compact={compact}
      />
    ));
  }

  const emptyMessage =
    tab === "urgent"
      ? copy.emptyUrgent
      : tab === "saved"
        ? copy.emptySaved
        : copy.noData;
  const emptyHint =
    tab === "urgent"
      ? copy.emptyUrgentHint
      : tab === "saved"
        ? copy.emptySavedHint
        : copy.emptyHint;

  return (
    <Stack gap={4} className="pb-8">
      <div className="flex w-full min-w-0 flex-wrap items-center gap-1.5">
          <button
            type="button"
            aria-label={copy.tabSaved}
            aria-pressed={tab === "saved"}
            onClick={() => setTab(tab === "saved" ? "all" : "saved")}
            className={cn(
              "relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
              tab === "saved"
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground",
            )}
          >
            <Bookmark className="h-4 w-4" />
            {savedUnread > 0 && tab !== "saved" ? (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[var(--dh-brand)]" />
            ) : null}
          </button>
          <button
            type="button"
            aria-label={copy.search}
            aria-pressed={searchOpen}
            onClick={() => setSearchOpen((v) => !v)}
            className={cn(
              "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
              searchOpen
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground",
            )}
          >
            <Search className="h-4 w-4" />
          </button>
          <DateRangeQuickPills
            value={dateRange}
            onChange={setDateRange}
            locale={locale}
          />
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            locale={locale}
          />
      </div>

      {searchOpen ? (
        <Input
          aria-label={copy.search}
          placeholder={copy.search}
          value={q}
          autoFocus
          onChange={(e) => setQ(e.target.value)}
        />
      ) : null}

      {tab !== "saved" ? (
        <FeedStatsBar
          counts={counts}
          total={searchedPool.length}
          activeTab={tab}
          onSelect={setTab}
          locale={locale}
        />
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-2xl border border-[var(--dh-brand)]/25 bg-[var(--dh-brand-soft)]/30 px-4 py-3">
            <Bookmark className="h-4 w-4 fill-current text-[var(--dh-brand)]" />
            <Text weight="medium">{copy.tabSaved}</Text>
            <span className="rounded-full bg-background/80 px-2 py-0.5 text-[length:var(--dh-text-2xs)] font-semibold tabular-nums text-muted-foreground">
              {counts.saved}
            </span>
          </div>
          <FeedStatsBar
            counts={counts}
            total={searchedPool.length}
            activeTab="all"
            onSelect={setTab}
            locale={locale}
          />
        </div>
      )}

      {tab === "all" ? (
        <Stack gap={3}>
          {sections.urgent.length > 0 ? (
            <FeedSection
              title={copy.tabUrgent}
              count={sections.urgent.length}
              description={copy.sectionUrgentDesc}
              tone="urgent"
              viewAllLabel={copy.viewAll}
              onViewAll={() => setTab("urgent")}
            >
              {renderItems(sections.urgent, true)}
            </FeedSection>
          ) : null}

          {sections.github.length > 0 ? (
            <FeedSection
              title={copy.tabGithub}
              count={sections.github.length}
              description={copy.sectionGithubDesc}
              viewAllLabel={copy.viewAll}
              onViewAll={() => setTab("github")}
            >
              {renderItems(
                sections.github.slice(0, SECTION_LIMITS.github),
                true,
              )}
            </FeedSection>
          ) : null}

          {sections.read.length > 0 ? (
            <FeedSection
              title={copy.sectionRead}
              count={sections.read.length}
              description={copy.sectionReadDesc}
            >
              {renderItems(sections.read.slice(0, SECTION_LIMITS.read), true)}
            </FeedSection>
          ) : null}

          {searchedPool.length === 0 ? (
            <EmptyState title={copy.noData} hint={copy.emptyHint} />
          ) : null}
        </Stack>
      ) : filtered.length === 0 ? (
        <EmptyState title={emptyMessage} hint={emptyHint} />
      ) : (
        <Stack gap={1}>{renderItems(filtered)}</Stack>
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
        onSavedChange={handleSavedChange}
        onTreatedChange={handleTreatedChange}
      />
    </Stack>
  );
}
