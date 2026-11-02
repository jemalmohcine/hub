import {
  HUB_COLOR_MODE_STORAGE_KEY,
  migrateColorModeStorage,
  type HubColorPreference,
} from "~/shared/lib/color-mode-storage";

export default defineNuxtPlugin({
  name: "hub-color-mode-migrate",
  enforce: "pre",
  setup() {
    let fromStorage: HubColorPreference | null = null;
    try {
      fromStorage = migrateColorModeStorage(localStorage);
    } catch {
      /* blocked storage */
    }

    const cookie = useCookie<HubColorPreference>(HUB_COLOR_MODE_STORAGE_KEY);
    if (fromStorage && cookie.value !== fromStorage) {
      cookie.value = fromStorage;
    }
  },
});
