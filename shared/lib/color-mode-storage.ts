export type HubColorPreference = "light" | "dark" | "auto";

export const HUB_COLOR_MODE_STORAGE_KEY = "hub-color-mode";

const LEGACY_STORAGE_KEYS = ["vueuse-color-scheme", "nuxt-color-mode", "color-mode"] as const;

export function parseColorPreference(raw: unknown): HubColorPreference | null {
  if (raw === "light" || raw === "dark" || raw === "auto") return raw;
  return null;
}

/** Normalize anything we might find in localStorage or cookies (plain string, JSON string, Nuxt-style object). */
export function normalizeStoredColorMode(raw: string | null | undefined): HubColorPreference | null {
  if (raw == null || raw === "") return null;
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

/** VueUse `useStorage` string serializer: plain value, no JSON quotes. */
export function serializeColorPreference(pref: HubColorPreference): string {
  return pref;
}

export function readStoredColorPreference(
  storage: Pick<Storage, "getItem">,
  key = HUB_COLOR_MODE_STORAGE_KEY,
): HubColorPreference | null {
  return normalizeStoredColorMode(storage.getItem(key));
}

export function writeStoredColorPreference(
  storage: Pick<Storage, "setItem">,
  pref: HubColorPreference,
  key = HUB_COLOR_MODE_STORAGE_KEY,
): void {
  storage.setItem(key, serializeColorPreference(pref));
}

/** Migrate legacy keys and fix JSON-quoted values to plain strings. */
export function migrateColorModeStorage(storage: Pick<Storage, "getItem" | "setItem">): HubColorPreference | null {
  let pref = readStoredColorPreference(storage, HUB_COLOR_MODE_STORAGE_KEY);

  if (!pref) {
    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      pref = normalizeStoredColorMode(storage.getItem(legacyKey));
      if (pref) break;
    }
  }

  if (!pref) return null;

  writeStoredColorPreference(storage, pref, HUB_COLOR_MODE_STORAGE_KEY);
  return pref;
}

export function resolveColorModeIsDark(preference: HubColorPreference, prefersDark: boolean): boolean {
  if (preference === "dark") return true;
  if (preference === "light") return false;
  return prefersDark;
}

/** Inline boot script: same key order and parsing as migrate/read (cookie then localStorage). */
export const INLINE_COLOR_MODE_INIT_SCRIPT =
  '(()=>{try{var key="hub-color-mode";var legacy=["vueuse-color-scheme","nuxt-color-mode","color-mode"];function norm(raw){if(!raw)return null;var t=raw.trim();if(t==="light"||t==="dark"||t==="auto")return t;try{var p=JSON.parse(t);if(typeof p==="string")return norm(p);if(p&&typeof p==="object")return norm(p.preference||p.value||null);}catch(e){}return null;}function readCookie(){var m=document.cookie.match(/(?:^|; )hub-color-mode=([^;]*)/);return m?decodeURIComponent(m[1]):null;}var pref=norm(readCookie());if(!pref){var raw=localStorage.getItem(key);pref=norm(raw);}if(!pref){for(var i=0;i<legacy.length;i++){pref=norm(localStorage.getItem(legacy[i]));if(pref)break;}}if(!pref)return;var dark=pref==="dark"||(pref==="auto"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",dark);}catch(e){}})();';
