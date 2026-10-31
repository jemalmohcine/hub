/** The two locales the hub ships. Everything user-facing resolves to one of these. */
export type HubLocale = "fr" | "en";

/** What the user can persist in settings — "auto" defers to the browser. */
export type LocalePreference = "auto" | HubLocale;

const DEFAULT_LOCALE: HubLocale = "fr";

/** Intl identifiers, kept here so no module hardcodes "fr-FR" again. */
export const INTL_LOCALE: Record<HubLocale, string> = {
  fr: "fr-FR",
  en: "en-US",
};

export function normalizeLocale(value: string | null | undefined): HubLocale {
  if (!value) return DEFAULT_LOCALE;
  return value.toLowerCase().startsWith("en") ? "en" : DEFAULT_LOCALE;
}

export function normalizeLocalePreference(
  value: string | null | undefined,
): LocalePreference {
  if (!value) return "auto";
  const v = value.toLowerCase();
  if (v === "auto") return "auto";
  if (v.startsWith("en")) return "en";
  if (v.startsWith("fr")) return "fr";
  return "auto";
}

/** Resolve effective UI locale: settings override, else browser / Accept-Language. */
export function resolveLocale(
  preference: string | null | undefined,
  browserLanguage: string | null | undefined,
): HubLocale {
  const pref = normalizeLocalePreference(preference);
  if (pref !== "auto") return pref;

  const hints = (browserLanguage || "")
    .split(",")
    .map((part) => part.trim().toLowerCase().split(";")[0]);

  for (const hint of hints) {
    if (hint.startsWith("en")) return "en";
    if (hint.startsWith("fr")) return "fr";
  }
  return DEFAULT_LOCALE;
}
