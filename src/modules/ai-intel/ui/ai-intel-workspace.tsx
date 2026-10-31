"use client";

import { useMemo, useState } from "react";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import {
  EmptyState,
  IconButton,
  Input,
  Select,
  Stack,
  Text,
} from "@/design-system";
import { addDaysIso, formatDate, toDayKey } from "@/lib/dates";
import type { HubLocale } from "@/core/i18n";
import {
  VEILLE_FILTER_CHIPS,
  VEILLE_PROVIDER_LABELS,
} from "@/modules/ai-intel/veille/labels";
import type {
  VeilleCategory,
  VeilleItem,
  VeilleProvider,
} from "@/modules/ai-intel/veille/types";
import { sortVeilleItems } from "@/modules/ai-intel/veille/sort";
import { VeilleDetailModal } from "@/modules/ai-intel/ui/veille-detail-modal";
import { VeilleFeedRow } from "@/modules/ai-intel/ui/veille-feed-row";
import { cn } from "@/lib/utils";

type CategoryFilter = "all" | VeilleCategory;

export function VeilleWorkspace({
  initialItems,
  initialDay,
  availableDays,
  initialLocale = "fr",
  deepLinkItemId = null,
}: {
  initialItems: VeilleItem[];
  initialDay: string;
  availableDays: string[];
  initialLocale?: HubLocale;
  deepLinkItemId?: string | null;
}) {
  const locale = initialLocale;
  const [day, setDay] = useState(initialDay);
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [provider, setProvider] = useState<VeilleProvider | "all">("all");
  const [savedOnly, setSavedOnly] = useState(false);
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [items, setItems] = useState(initialItems);
  const [selectedId, setSelectedId] = useState<string | null>(
    deepLinkItemId ?? null,
  );

  const dayLabel = formatDate(day, locale, "dayMonthYear");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let list = items.filter((item) => item.feed_date === day);
    if (category !== "all") {
      list = list.filter((item) => item.category === category);
    }
    if (provider !== "all") {
      list = list.filter((item) => item.provider === provider);
    }
    if (savedOnly) {
      list = list.filter((item) => item.saved);
    }
    if (query) {
      list = list.filter((item) =>
        `${item.title} ${item.summary} ${item.tags.join(" ")}`
          .toLowerCase()
          .includes(query),
      );
    }
    return sortVeilleItems(list);
  }, [items, day, category, provider, savedOnly, q]);

  const selected =
    selectedId != null
      ? (items.find((i) => i.id === selectedId) ?? null)
      : null;

  const today = toDayKey(new Date());
  const oldestDay = availableDays[availableDays.length - 1];

  function shiftDay(delta: number) {
    setDay((current) => {
      const next = addDaysIso(current, delta);
      if (next > today) return current;
      return next;
    });
  }

  function openItem(item: VeilleItem) {
    setSelectedId(item.id);
  }

  function handleSavedChange(itemId: string, saved: boolean) {
    setItems((prev) =>
      prev.map((x) => (x.id === itemId ? { ...x, saved } : x)),
    );
  }

  const hasNewer = day < today;
  const hasOlder = oldestDay ? day > oldestDay : true;

  return (
    <Stack gap={4} className="pb-8">
      <div className="flex flex-wrap items-center gap-2">
        <IconButton
          type="button"
          variant="ghost"
          size="sm"
          label="Jour précédent"
          onClick={() => shiftDay(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </IconButton>
        <Text weight="medium" className="min-w-[10rem] text-center tabular-nums">
          {dayLabel || day}
        </Text>
        <IconButton
          type="button"
          variant="ghost"
          size="sm"
          label="Jour suivant"
          disabled={!hasNewer}
          onClick={() => shiftDay(1)}
        >
          <ChevronRight className="h-4 w-4" />
        </IconButton>
        {hasOlder ? (
          <Text size="sm" tone="muted" className="ml-auto">
            Historique disponible
          </Text>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          aria-label="Sauvegardés"
          aria-pressed={savedOnly}
          onClick={() => setSavedOnly((v) => !v)}
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            savedOnly
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground",
          )}
        >
          <Bookmark className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Rechercher"
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
        <Select
          aria-label="Fournisseur"
          value={provider}
          onChange={(e) =>
            setProvider(e.target.value as VeilleProvider | "all")
          }
          className="h-9 min-w-[9rem] rounded-xl text-[length:var(--dh-text-sm)]"
        >
          <option value="all">Tous les fournisseurs</option>
          {Object.entries(VEILLE_PROVIDER_LABELS).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      {searchOpen ? (
        <Input
          aria-label="Rechercher dans la veille"
          placeholder="Rechercher…"
          value={q}
          autoFocus
          onChange={(e) => setQ(e.target.value)}
        />
      ) : null}

      <div className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {VEILLE_FILTER_CHIPS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => setCategory(chip.id)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-[length:var(--dh-text-xs)] font-medium transition-colors",
              category === chip.id
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground",
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={savedOnly ? "Aucun élément sauvegardé" : "Rien pour ce jour"}
          hint={
            savedOnly
              ? "Enregistre un article depuis le détail pour le retrouver ici."
              : "Change de jour ou élargis les filtres. Le flux est alimenté chaque matin."
          }
        />
      ) : (
        <Stack gap={1}>
          {filtered.map((item) => (
            <VeilleFeedRow key={item.id} item={item} onOpen={openItem} />
          ))}
        </Stack>
      )}

      <VeilleDetailModal
        item={selected}
        open={selectedId != null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        onSavedChange={handleSavedChange}
      />
    </Stack>
  );
}

/** @deprecated Use VeilleWorkspace — kept as alias for existing imports during transition. */
export const AiIntelWorkspace = VeilleWorkspace;
