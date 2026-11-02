import {
  HUB_COLOR_MODE_STORAGE_KEY,
  type HubColorPreference,
  parseColorPreference,
} from "~/shared/lib/color-mode-storage";

const hubColorModeOptions = {
  storageKey: HUB_COLOR_MODE_STORAGE_KEY,
  initialValue: "auto" as HubColorPreference,
  selector: "html",
  attribute: "class" as const,
  modes: {
    auto: "",
    light: "",
    dark: "dark",
  },
};

export function useHubColorMode() {
  const mode = useColorMode(hubColorModeOptions);

  const preference = computed({
    get(): HubColorPreference {
      return parseColorPreference(mode.store.value) ?? "auto";
    },
    set(value: HubColorPreference) {
      mode.store.value = value;
    },
  });

  const isDark = computed(() => mode.state.value === "dark");

  function setPreference(value: HubColorPreference) {
    mode.store.value = value;
  }

  function toggleLightDark() {
    setPreference(isDark.value ? "light" : "dark");
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
}
