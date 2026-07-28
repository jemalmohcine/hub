"use client";

import { useMemo, useState } from "react";
import { Bookmark, CalendarDays } from "lucide-react";
import {
  Card,
  Cluster,
  Heading,
  Input,
  Select,
  Stack,
  Text,
} from "@/design-system";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeedItemRow } from "@/modules/ai-intel/ui/feed-item-row";
import { ItemDetailModal } from "@/modules/ai-intel/ui/item-detail-modal";
import {
  PILLAR_LABELS,
  URGENCY_LABELS,
  type AiIntelItem,
  type AiPillar,
  type AiUrgency,
} from "@/modules/ai-intel/types";

type TabId = AiPillar | "saved";

const TABS: { id: TabId; label: string }[] = [
  { id: "models", label: PILLAR_LABELS.models },
  { id: "tools", label: PILLAR_LABELS.tools },
  { id: "opensource", label: PILLAR_LABELS.opensource },
  { id: "world", label: PILLAR_LABELS.world },
  { id: "saved", label: "Saved" },
];

function todayIsoDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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

export function AiIntelWorkspace({
  initialItems,
  digestLabel,
}: {
  initialItems: AiIntelItem[];
  digestLabel: string | null;
}) {
  const [tab, setTab] = useState<TabId>("models");
  const [urgency, setUrgency] = useState<AiUrgency | "all">("all");
  const [category, setCategory] = useState("all");
  const [q, setQ] = useState("");
  const [date, setDate] = useState(todayIsoDate);
  const [allDates, setAllDates] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const items = initialItems;

  const datedItems = useMemo(() => {
    if (allDates) return items;
    return items.filter((item) => itemDay(item) === date);
  }, [items, date, allDates]);

  const urgentToday = useMemo(
    () => datedItems.filter((i) => i.urgency === "urgent"),
    [datedItems],
  );

  const counts = useMemo(() => {
    const base: Record<TabId, number> = {
      models: 0,
      tools: 0,
      opensource: 0,
      world: 0,
      saved: 0,
    };
    for (const item of datedItems) {
      base[item.pillar] += 1;
      if (item.saved) base.saved += 1;
    }
    return base;
  }, [datedItems]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const item of datedItems) {
      if (tab === "saved" ? item.saved : item.pillar === tab) {
        set.add(item.category);
      }
    }
    return [...set].sort();
  }, [datedItems, tab]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return datedItems.filter((item) => {
      if (tab === "saved") {
        if (!item.saved) return false;
      } else if (item.pillar !== tab) {
        return false;
      }
      if (urgency !== "all" && item.urgency !== urgency) return false;
      if (category !== "all" && item.category !== category) return false;
      if (
        query &&
        !`${item.title} ${item.summary}`.toLowerCase().includes(query)
      ) {
        return false;
      }
      return true;
    });
  }, [datedItems, tab, urgency, category, q]);

  const selected =
    selectedId != null
      ? (items.find((i) => i.id === selectedId) ?? null)
      : null;

  return (
    <Stack gap={4}>
      <Cluster gap={2} className="w-full flex-wrap justify-between">
        <Text size="sm" tone="muted">
          {digestLabel
            ? `Mis à jour le ${digestLabel}`
            : "Pas encore de données"}
        </Text>
        <Cluster gap={2} className="flex-wrap">
          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <Input
              type="date"
              aria-label="Date"
              className="min-w-[11rem]"
              value={date}
              disabled={allDates}
              onChange={(e) => {
                setDate(e.target.value || todayIsoDate());
                setAllDates(false);
              }}
            />
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allDates}
              onChange={(e) => setAllDates(e.target.checked)}
              className="size-4 rounded border-border"
            />
            Tous les jours
          </label>
        </Cluster>
      </Cluster>

      {urgentToday.length > 0 ? (
        <Card
          variant="accent"
          className="border-[var(--dh-danger)]/20 bg-[var(--dh-danger-soft)]/40 p-[var(--dh-space-3)]"
        >
          <Text size="sm">
            <span className="font-medium text-[var(--dh-danger)]">
              {urgentToday.length} info
              {urgentToday.length > 1 ? "s" : ""} urgente
              {urgentToday.length > 1 ? "s" : ""}
            </span>
            {" · "}
            ouvre la cloche en haut pour les notifications platform.
          </Text>
        </Card>
      ) : null}

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as TabId);
          setCategory("all");
        }}
      >
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="min-w-[7.5rem]">
              {t.id === "saved" ? (
                <Bookmark className="h-3.5 w-3.5" />
              ) : null}
              <span className="truncate">{t.label}</span>
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground">
                {counts[t.id]}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((t) => (
          <TabsContent key={t.id} value={t.id}>
            <Stack gap={4}>
              <Cluster gap={2} className="w-full flex-wrap">
                <Select
                  aria-label="Urgence"
                  className="min-w-[9rem] flex-1"
                  value={urgency}
                  onChange={(e) =>
                    setUrgency(e.target.value as AiUrgency | "all")
                  }
                >
                  <option value="all">Toute urgence</option>
                  {Object.entries(URGENCY_LABELS).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </Select>
                <Select
                  aria-label="Catégorie"
                  className="min-w-[9rem] flex-1"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="all">Toutes catégories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
                <Input
                  aria-label="Recherche"
                  className="min-w-[12rem] flex-[2]"
                  placeholder="Rechercher…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </Cluster>

              {t.id === "saved" ? (
                <div>
                  <Heading level={3}>Tes sauvegardes</Heading>
                  <Text size="sm" tone="muted" className="mt-1">
                    Ce que tu as mis de côté pour plus tard.
                  </Text>
                </div>
              ) : null}

              {filtered.length === 0 ? (
                <Card className="p-[var(--dh-space-5)]">
                  <Heading level={3}>No data</Heading>
                </Card>
              ) : (
                <Stack gap={2}>
                  {filtered.map((item) => (
                    <FeedItemRow
                      key={item.id}
                      item={item}
                      onOpen={(it) => setSelectedId(it.id)}
                    />
                  ))}
                </Stack>
              )}
            </Stack>
          </TabsContent>
        ))}
      </Tabs>

      <ItemDetailModal
        item={selected}
        open={selectedId != null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </Stack>
  );
}
