"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Text } from "@/design-system";
import type { HubLocale } from "@/core/i18n";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

export type DatePreset = "today" | "7d" | "month" | "year" | "range";

/** Rolling window for the 7-day preset. */
const ROLLING_DAYS = 7;

export type DateRangeValue = {
  preset: DatePreset;
  from: string;
  to: string;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function rangeForPreset(preset: Exclude<DatePreset, "range">): {
  from: string;
  to: string;
} {
  const now = startOfDay(new Date());
  const to = toIsoDate(now);

  if (preset === "today") return { from: to, to };

  if (preset === "7d") {
    const from = new Date(now);
    from.setDate(now.getDate() - (ROLLING_DAYS - 1));
    return { from: toIsoDate(from), to };
  }

  if (preset === "month") {
    return {
      from: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
      to,
    };
  }

  return {
    from: toIsoDate(new Date(now.getFullYear(), 0, 1)),
    to,
  };
}

export function defaultDateRange(): DateRangeValue {
  const { from, to } = rangeForPreset("today");
  return { preset: "today", from, to };
}

function fmtShort(iso: string, locale: HubLocale) {
  const [, m, d] = iso.split("-");
  return locale === "fr" ? `${d}/${m}` : `${m}/${d}`;
}

function labelForRange(value: DateRangeValue, locale: HubLocale): string {
  const L =
    locale === "fr"
      ? {
          today: "Aujourd’hui",
          "7d": "7 derniers jours",
          month: "Ce mois",
          year: "Cette année",
        }
      : {
          today: "Today",
          "7d": "Last 7 days",
          month: "This month",
          year: "This year",
        };

  if (value.preset !== "range") return L[value.preset];
  if (value.from === value.to) return fmtShort(value.from, locale);
  return `${fmtShort(value.from, locale)} › ${fmtShort(value.to, locale)}`;
}

const PRESETS: Array<Exclude<DatePreset, "range">> = [
  "today",
  "7d",
  "month",
  "year",
];

function monthMatrix(view: Date): Array<Date | null> {
  const year = view.getFullYear();
  const month = view.getMonth();
  const first = new Date(year, month, 1);
  const startPad = (first.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<Date | null> = [];
  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(new Date(year, month, d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function presetIsActive(
  value: DateRangeValue,
  preset: Exclude<DatePreset, "range">,
): boolean {
  if (value.preset === preset) return true;
  const range = rangeForPreset(preset);
  return value.from === range.from && value.to === range.to;
}

export function DateRangePicker({
  value,
  onChange,
  locale,
}: {
  value: DateRangeValue;
  onChange: (next: DateRangeValue) => void;
  locale: HubLocale;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => parseIso(value.from));
  const [picking, setPicking] = useState<"from" | "to">("from");
  const [draftFrom, setDraftFrom] = useState(value.from);
  const [draftTo, setDraftTo] = useState(value.to);

  const copy = useMemo(
    () =>
      locale === "fr"
        ? {
            today: "Aujourd’hui",
            "7d": "7 derniers jours",
            month: "Ce mois",
            year: "Cette année",
            custom: "Personnalisé",
            from: "Début",
            to: "Fin",
            close: "Fermer",
            title: "Période",
            days: ["L", "M", "M", "J", "V", "S", "D"],
          }
        : {
            today: "Today",
            "7d": "Last 7 days",
            month: "This month",
            year: "This year",
            custom: "Custom",
            from: "Start",
            to: "End",
            close: "Close",
            title: "Date range",
            days: ["M", "T", "W", "T", "F", "S", "S"],
          },
    [locale],
  );

  const monthTitle = useMemo(() => {
    return formatDate(view, locale, "monthYear");
  }, [view, locale]);

  const cells = useMemo(() => monthMatrix(view), [view]);
  const todayIso = toIsoDate(startOfDay(new Date()));

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function openPanel() {
    setDraftFrom(value.from);
    setDraftTo(value.to);
    setPicking("from");
    setView(parseIso(value.from));
    setOpen(true);
  }

  function selectPreset(preset: Exclude<DatePreset, "range">) {
    const range = rangeForPreset(preset);
    onChange({ preset, ...range });
    setDraftFrom(range.from);
    setDraftTo(range.to);
    setOpen(false);
  }

  function onDayClick(day: Date) {
    const iso = toIsoDate(day);
    if (picking === "from" || iso < draftFrom) {
      setDraftFrom(iso);
      setDraftTo(iso);
      setPicking("to");
      return;
    }
    let from = draftFrom;
    let to = iso;
    if (from > to) [from, to] = [to, from];
    onChange({ preset: "range", from, to });
    setOpen(false);
  }

  function inDraftRange(iso: string) {
    const a = draftFrom <= draftTo ? draftFrom : draftTo;
    const b = draftFrom <= draftTo ? draftTo : draftFrom;
    return iso >= a && iso <= b;
  }

  function isEdge(iso: string) {
    return iso === draftFrom || iso === draftTo;
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => (open ? setOpen(false) : openPanel())}
        className="inline-flex h-9 max-w-[13rem] items-center gap-2 rounded-full border border-border/80 bg-card px-3 text-sm font-medium shadow-sm active:scale-[0.98]"
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-[var(--dh-brand)]" />
        <span className="truncate">{labelForRange(value, locale)}</span>
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label={copy.close}
            className="fixed inset-0 z-40 bg-overlay backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-label={copy.title}
            className={cn(
              "z-50 overflow-hidden border border-border bg-card shadow-2xl",
              "fixed inset-x-0 bottom-0 max-h-[min(92dvh,40rem)] overflow-y-auto rounded-t-3xl border-b-0",
              "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
              "sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:mt-2 sm:max-h-none sm:w-80 sm:rounded-3xl sm:border-b",
            )}
          >
            <div className="flex items-center justify-between px-4 pb-1 pt-3">
              <Text weight="medium">{copy.title}</Text>
              <button
                type="button"
                aria-label={copy.close}
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex gap-1.5 overflow-x-auto px-3 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {PRESETS.map((preset) => {
                const active = presetIsActive(value, preset);
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => selectPreset(preset)}
                    className={cn(
                      "inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-xs font-semibold",
                      active
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {active ? <Check className="h-3 w-3" /> : null}
                    {copy[preset]}
                  </button>
                );
              })}
            </div>

            <div className="mx-3 mb-3 min-w-0 rounded-2xl bg-muted/40 p-2.5 sm:p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  aria-label={locale === "fr" ? "Mois précédent" : "Previous month"}
                  onClick={() =>
                    setView(
                      new Date(view.getFullYear(), view.getMonth() - 1, 1),
                    )
                  }
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-background"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <Text size="sm" weight="medium" className="capitalize">
                  {monthTitle}
                </Text>
                <button
                  type="button"
                  aria-label={locale === "fr" ? "Mois suivant" : "Next month"}
                  onClick={() =>
                    setView(
                      new Date(view.getFullYear(), view.getMonth() + 1, 1),
                    )
                  }
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-background"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-1 grid min-w-0 grid-cols-7 gap-0.5 sm:gap-1">
                {copy.days.map((d, i) => (
                  <div
                    key={`${d}-${i}`}
                    className="py-1 text-center text-[length:var(--dh-text-2xs)] font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid min-w-0 grid-cols-7 gap-0.5 sm:gap-1">
                {cells.map((day, idx) => {
                  if (!day) {
                    return <div key={`e-${idx}`} className="aspect-square min-h-8 sm:min-h-9" />;
                  }
                  const iso = toIsoDate(day);
                  const selected = isEdge(iso);
                  const mid = inDraftRange(iso) && !selected;
                  const isToday = iso === todayIso;
                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => onDayClick(day)}
                      className={cn(
                        "relative aspect-square min-h-8 rounded-lg text-xs font-medium transition-colors sm:min-h-9 sm:rounded-xl sm:text-sm",
                        selected &&
                          "bg-[var(--dh-brand)] text-[var(--dh-brand-foreground)]",
                        mid && "bg-[var(--dh-brand-soft)]/70 text-foreground",
                        !selected &&
                          !mid &&
                          "hover:bg-background text-foreground",
                        isToday && !selected && "ring-1 ring-[var(--dh-brand)]/40",
                      )}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-background/70 px-3 py-2">
                <div>
                  <Text size="sm" tone="muted">
                    {copy.from}
                  </Text>
                  <Text size="sm" weight="medium">
                    {fmtShort(draftFrom, locale)}
                  </Text>
                </div>
                <span className="text-muted-foreground">›</span>
                <div className="text-right">
                  <Text size="sm" tone="muted">
                    {copy.to}
                  </Text>
                  <Text size="sm" weight="medium">
                    {fmtShort(draftTo, locale)}
                  </Text>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

/** Inline chips: Aujourd’hui + 7 derniers jours (no modal). */
export function DateRangeQuickPills({
  value,
  onChange,
  locale,
}: {
  value: DateRangeValue;
  onChange: (next: DateRangeValue) => void;
  locale: HubLocale;
}) {
  const labels =
    locale === "fr"
      ? { today: "Aujourd’hui", "7d": "7 derniers jours" }
      : { today: "Today", "7d": "Last 7 days" };

  const quick: Array<"today" | "7d"> = ["today", "7d"];

  return (
    <div className="flex shrink-0 gap-1">
      {quick.map((preset) => {
        const active = presetIsActive(value, preset);
        return (
          <button
            key={preset}
            type="button"
            onClick={() => {
              const range = rangeForPreset(preset);
              onChange({ preset, ...range });
            }}
            className={cn(
              "inline-flex h-8 shrink-0 items-center rounded-full px-2.5 text-[11px] font-semibold sm:px-3 sm:text-xs",
              active
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground",
            )}
          >
            {labels[preset]}
          </button>
        );
      })}
    </div>
  );
}

export function itemInRange(
  itemDayIso: string,
  range: DateRangeValue,
): boolean {
  if (!itemDayIso) return false;
  return itemDayIso >= range.from && itemDayIso <= range.to;
}
