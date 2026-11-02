import { migrateColorModeStorage } from "~/shared/lib/color-mode-storage";

export default defineNuxtPlugin(() => {
  try {
    migrateColorModeStorage(localStorage);
  } catch {
    /* private mode / blocked storage */
  }
});
