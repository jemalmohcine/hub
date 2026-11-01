export type HubLocale = "fr" | "en";

const INTL: Record<HubLocale, string> = { fr: "fr-FR", en: "en-US" };

export type DateStyle =
  | "dayMonth"
  | "dayMonthYear"
  | "monthYear"
  | "short"
  | "dateTime"
  | "weekdayDayMonth";

const FORMATS: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  dayMonth: { day: "2-digit", month: "short" },
  dayMonthYear: { day: "2-digit", month: "short", year: "numeric" },
  weekdayDayMonth: { weekday: "long", day: "numeric", month: "long" },
  monthYear: { month: "long", year: "numeric" },
  short: { day: "2-digit", month: "2-digit", year: "numeric" },
  dateTime: {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  },
};

export function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(
  value: string | number | Date | null | undefined,
  locale: HubLocale = "fr",
  style: DateStyle = "dayMonth",
): string {
  const date = toDate(value);
  if (!date) return "";
  return date.toLocaleDateString(INTL[locale], FORMATS[style]);
}

export function toDayKey(value: string | number | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function addDaysIso(
  value: string | number | Date | null | undefined,
  days: number,
): string {
  const date = toDate(value) ?? new Date();
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return toDayKey(next);
}

/** Calendar day in hub timezone (YYYY-MM-DD), default Africa/Casablanca. */
export function hubDayKey(value: Date = new Date(), timeZone = "Africa/Casablanca"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}
