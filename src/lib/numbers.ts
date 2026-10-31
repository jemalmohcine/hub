import { INTL_LOCALE, type HubLocale } from "@/core/i18n/locale";

/** 1_234 → "1.2k", 2_400_000 → "2.4M". Used for stars, counts, metrics. */
export function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  return String(Math.round(value));
}

/** Thousands separators for the user's locale. */
export function formatNumber(value: number, locale: HubLocale = "fr"): string {
  return value.toLocaleString(INTL_LOCALE[locale]);
}

/** Money stored in cents → "1 250 €". */
export function formatCurrencyCents(
  cents: number,
  locale: HubLocale = "fr",
  currency = "EUR",
): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale], {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
