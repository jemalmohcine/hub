"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  isBeneficial,
  isNoise,
  sortForDeveloper,
} from "@/modules/ai-intel/ui/rank";
import type { AiLocale } from "@/modules/ai-intel/i18n/locale";
import { t } from "@/modules/ai-intel/i18n/locale";
import type { AiIntelItem, AiPillar } from "@/modules/ai-intel/types";
import { cn } from "@/lib/utils";

type TabId = "focus" | AiPillar | "saved";

function itemDay(item: AiIntelItem): string {
  const raw = item.ingested_at || item.published_at;
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function Section({
  label,
  hint,
  items,
  locale,
  onOpen,
}: {
  label: string;
  hint?: string;
  items: AiIntelItem[];
  locale: AiLocale;
  onOpen: (item: AiIntelItem) => void;
}) {
  if (items.length === 0) return null;
  return (
    <Stack gap={2}>
      <div className="px-1">
        <Text size="sm" weight="medium">
          {label}
          <span className="ml-1.5 tabular-nums text-muted-foreground">
            {items.length}
          </span>
        </Text>
        {hint ? (
          <Text size="sm" tone="muted" className="mt-0.5">
            {hint}
          </Text>
        ) : null}
      </div>
      <Stack gap={1}>
        {items.map((item) => (
          <FeedItemRow
            key={item.id}
            item={item}
            locale={locale}
            onOpen={onOpen}
          />
        ))}
      </Stack>
    </Stack>
  );
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
  const [tab, setTab] = useState<TabId>("focus");
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeValue>(defaultDateRange);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [items, setItems] = useState(initialItems);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const tabs: { id: TabId; label: string }[] = [
    { id: "focus", label: copy.essential },
    { id: "opensource", label: copy.repos },
    { id: "tools", label: copy.tools },
    { id: "models", label: copy.models },
    { id: "saved", label: copy.saved },
  ];

  const datedItems = useMemo(() => {
    return items.filter((item) => itemInRange(itemDay(item), dateRange));
  }, [items, dateRange]);

  const visiblePool = useMemo(() => {
    const pool = datedItems.filter(
      (i) => !isNoise(i) || i.urgency === "urgent" || i.saved,
    );
    return [...pool].sort(sortForDeveloper);
  }, [datedItems]);

  const counts = useMemo(() => {
    const base: Record<TabId, number> = {
      focus: 0,
      models: 0,
      tools: 0,
      opensource: 0,
      world: 0,
      saved: 0,
    };
    const focusIds = new Set<string>();
    for (const item of visiblePool) {
      base[item.pillar] += 1;
      if (item.saved) base.saved += 1;
      if (
        item.urgency === "urgent" ||
        isBeneficial(item) ||
        (item.pillar === "opensource" && !isNoise(item))
      ) {
        focusIds.add(item.id);
      }
    }
    base.focus = focusIds.size;
    return base;
  }, [visiblePool]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return visiblePool.filter((item) => {
      if (tab === "focus") {
        const keep =
          item.urgency === "urgent" ||
          isBeneficial(item) ||
          (item.pillar === "opensource" && !isNoise(item));
        if (!keep) return false;
      } else if (tab === "saved") {
        if (!item.saved) return false;
      } else if (item.pillar !== tab) {
        return false;
      }
      if (
        query &&
        !`${item.title} ${item.summary}`.toLowerCase().includes(query)
      ) {
        return false;
      }
      return true;
    });
  }, [visiblePool, tab, q]);

  const focusSections = useMemo(() => {
    if (tab !== "focus") return null;
    const impact = filtered.filter((i) => i.urgency === "urgent").slice(0, 8);
    const impactIds = new Set(impact.map((i) => i.id));
    const repos = filtered
      .filter(
        (i) =>
          !impactIds.has(i.id) &&
          i.pillar === "opensource" &&
          (isBeneficial(i) || !isNoise(i)),
      )
      .slice(0, 12);
    const repoIds = new Set(repos.map((i) => i.id));
    const useful = filtered
      .filter(
        (i) => !impactIds.has(i.id) && !repoIds.has(i.id) && isBeneficial(i),
      )
      .slice(0, 10);
    return { impact, repos, useful };
  }, [filtered, tab]);

  const selected =
    selectedId != null
      ? (items.find((i) => i.id === selectedId) ?? null)
      : null;

  return (
    <Stack gap={4}>
      <Cluster gap={2} className="w-full items-center justify-between">
        <Text size="sm" tone="muted" className="min-w-0 truncate">
          {digestLabel || (locale === "fr" ? "Pas encore de digest" : "No digest yet")}
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
            </button>
          );
        })}
      </div>

      {tab === "focus" ? (
        filtered.length === 0 ? (
          <Card className="p-6">
            <Heading level={3}>{copy.empty}</Heading>
            <Text size="sm" tone="muted" className="mt-1">
              {copy.emptyHint}
            </Text>
          </Card>
        ) : (
          <Stack gap={5}>
            <Section
              label={copy.sectionImpact}
              hint={
                locale === "fr"
                  ? "Peut casser ton stack, tes coûts ou ta prod."
                  : "May break your stack, costs, or prod."
              }
              items={focusSections?.impact ?? []}
              locale={locale}
              onOpen={(it) => setSelectedId(it.id)}
            />
            <Section
              label={copy.sectionRepos}
              hint={
                locale === "fr"
                  ? "Nouveaux repos utiles. Le titre dit ce que c’est."
                  : "Useful new repos. The title says what it is."
              }
              items={focusSections?.repos ?? []}
              locale={locale}
              onOpen={(it) => setSelectedId(it.id)}
            />
            <Section
              label={copy.sectionUseful}
              hint={
                locale === "fr"
                  ? "Outils et news avec un vrai bénéfice."
                  : "Tools and news with real upside."
              }
              items={focusSections?.useful ?? []}
              locale={locale}
              onOpen={(it) => setSelectedId(it.id)}
            />
          </Stack>
        )
      ) : filtered.length === 0 ? (
        <Card className="p-6">
          <Heading level={3}>{copy.noData}</Heading>
        </Card>
      ) : (
        <Stack gap={1}>
          {filtered.map((item) => (
            <FeedItemRow
              key={item.id}
              item={item}
              locale={locale}
              onOpen={(it) => setSelectedId(it.id)}
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
