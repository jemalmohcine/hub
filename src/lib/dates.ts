import { INTL_LOCALE, type HubLocale } from "@/core/i18n/locale";
import { UI } from "@/core/i18n/ui-copy";

export type DateStyle =
  | "dayMonth" // 07 août
  | "dayMonthYear" // 07 août 2026
  | "monthYear" // août 2026
  | "short" // 07/08/2026
  | "dateTime"; // 07/08 16:40

const FORMATS: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  dayMonth: { day: "2-digit", month: "short" },
  dayMonthYear: { day: "2-digit", month: "short", year: "numeric" },
  monthYear: { month: "long", year: "numeric" },
  short: { day: "2-digit", month: "2-digit", year: "numeric" },
  dateTime: {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  },
};

/** Parse anything date-ish into a valid Date, or null. Never throws. */
export function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Single entry point for date rendering. Returns "" when the input is unusable. */
export function formatDate(
  value: string | number | Date | null | undefined,
  locale: HubLocale,
  style: DateStyle = "dayMonth",
): string {
  const date = toDate(value);
  if (!date) return "";
  return date.toLocaleDateString(INTL_LOCALE[locale], FORMATS[style]);
}

export function formatDateTime(
  value: string | number | Date | null | undefined,
  locale: HubLocale,
): string {
  const date = toDate(value);
  if (!date) return "";
  return date.toLocaleString(INTL_LOCALE[locale], FORMATS.dateTime);
}

/** "À l'instant" / "Il y a 3 h", falling back to a short date past a week. */
export function formatRelativeTime(
  value: string | number | Date | null | undefined,
  locale: HubLocale,
  now: number = Date.now(),
): string {
  const date = toDate(value);
  if (!date) return "";

  const copy = UI[locale];
  const minutes = Math.floor((now - date.getTime()) / 60_000);

  if (minutes < 1) return copy.justNow;
  if (minutes < 60) return copy.minutesAgo(minutes);

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return copy.hoursAgo(hours);

  const days = Math.floor(hours / 24);
  if (days < 7) return copy.daysAgo(days);

  return formatDate(date, locale, "dayMonth");
}

/** ISO day key (YYYY-MM-DD) in local time — used for grouping and range filters. */
export function toDayKey(value: string | number | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Month key (YYYY-MM) — used by the expenses module. */
export function toMonthKey(value: string | number | Date | null | undefined = new Date()): string {
  return toDayKey(value).slice(0, 7);
}

export function daysBetween(from: string | number | Date, to: string | number | Date = Date.now()): number {
  const start = toDate(from);
  const end = toDate(to);
  if (!start || !end) return 0;
  return Math.floor((end.getTime() - start.getTime()) / 86_400_000);
}
