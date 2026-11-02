export type HubColorPreference = "light" | "dark" | "auto";

export const HUB_COLOR_MODE_STORAGE_KEY = "hub-color-mode";

const LEGACY_STORAGE_KEYS = ["vueuse-color-scheme", "nuxt-color-mode", "color-mode"] as const;

export function parseColorPreference(raw: unknown): HubColorPreference | null {
  if (raw === "light" || raw === "dark" || raw === "auto") return raw;
  return null;
}

/** Normalize anything we might find in localStorage (plain string, JSON string, Nuxt-style object). */
export function normalizeStoredColorMode(raw: string | null): HubColorPreference | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const direct = parseColorPreference(trimmed);
  if (direct) return direct;

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (typeof parsed === "string") return parseColorPreference(parsed);
    if (parsed && typeof parsed === "object") {
      const obj = parsed as Record<string, unknown>;
      const fromPreference = parseColorPreference(obj.preference);
      if (fromPreference) return fromPreference;
      const fromValue = parseColorPreference(obj.value);
      if (fromValue) return fromValue;
    }
  } catch {
    /* plain non-JSON string already handled */
  }
  return null;
}

/** What VueUse `useStorage` expects in localStorage (JSON-encoded string). */
export function serializeColorPreference(pref: HubColorPreference): string {
  return JSON.stringify(pref);
}

export function readStoredColorPreference(storage: Storage, key = HUB_COLOR_MODE_STORAGE_KEY): HubColorPreference | null {
  return normalizeStoredColorMode(storage.getItem(key));
}

/** One-time migration from legacy keys and plain-string values. */
export function migrateColorModeStorage(storage: Storage): void {
  let pref = readStoredColorPreference(storage, HUB_COLOR_MODE_STORAGE_KEY);

  if (!pref) {
    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      pref = normalizeStoredColorMode(storage.getItem(legacyKey));
      if (pref) break;
    }
  }

  if (!pref) return;

  storage.setItem(HUB_COLOR_MODE_STORAGE_KEY, serializeColorPreference(pref));
}

export function resolveColorModeIsDark(preference: HubColorPreference, prefersDark: boolean): boolean {
  if (preference === "dark") return true;
  if (preference === "light") return false;
  return prefersDark;
}
