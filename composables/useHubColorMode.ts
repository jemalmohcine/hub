import { createSharedComposable } from "@vueuse/core";
import {
  HUB_COLOR_MODE_STORAGE_KEY,
  type HubColorPreference,
  parseColorPreference,
  writeStoredColorPreference,
} from "~/shared/lib/color-mode-storage";

const useHubColorModeImpl = createSharedComposable(() => {
  const preferenceStore = useCookie<HubColorPreference>(HUB_COLOR_MODE_STORAGE_KEY, {
    default: () => "auto",
    maxAge: 60 * 60 * 24 * 400,
    sameSite: "lax",
    watch: true,
  });

  const mode = useColorMode({
    storageRef: preferenceStore,
    storageKey: null,
    initialValue: "auto",
    selector: "html",
    attribute: "class",
    modes: {
      auto: "",
      light: "",
      dark: "dark",
    },
    onChanged() {
      /* html class is applied via useHead htmlAttrs in app.vue (SSR-safe). */
    },
  });

  const preference = computed({
    get(): HubColorPreference {
      return parseColorPreference(mode.store.value) ?? "auto";
    },
    set(value: HubColorPreference) {
      mode.store.value = value;
      persistPreference(value);
    },
  });

  const isDark = computed(() => mode.state.value === "dark");

  function persistPreference(value: HubColorPreference) {
    if (!import.meta.client) return;
    try {
      writeStoredColorPreference(localStorage, value);
    } catch {
      /* private mode */
    }
  }

  function setPreference(value: HubColorPreference) {
    preference.value = value;
  }

  function toggleLightDark() {
    setPreference(isDark.value ? "light" : "dark");
  }

  if (import.meta.client) {
    watch(
      () => preference.value,
      (value) => persistPreference(value),
      { immediate: true },
    );
  }

  return {
    mode,
    preference,
    isDark,
    setPreference,
    toggleLightDark,
    system: mode.system,
    state: mode.state,
    store: mode.store,
  };
});

export const useHubColorMode = useHubColorModeImpl;
