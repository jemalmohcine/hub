import { describe, expect, it } from "vitest";
import {
  migrateColorModeStorage,
  normalizeStoredColorMode,
  readStoredColorPreference,
  serializeColorPreference,
} from "./color-mode-storage";

describe("normalizeStoredColorMode", () => {
  it("accepts plain strings", () => {
    expect(normalizeStoredColorMode("dark")).toBe("dark");
    expect(normalizeStoredColorMode("light")).toBe("light");
  });

  it("accepts JSON string values", () => {
    expect(normalizeStoredColorMode(JSON.stringify("dark"))).toBe("dark");
  });

  it("accepts Nuxt-style preference objects", () => {
    expect(normalizeStoredColorMode(JSON.stringify({ preference: "dark" }))).toBe("dark");
  });
});

describe("migrateColorModeStorage", () => {
  it("writes JSON hub key from legacy plain string", () => {
    const storage = {
      data: {} as Record<string, string>,
      getItem(k: string) {
        return this.data[k] ?? null;
      },
      setItem(k: string, v: string) {
        this.data[k] = v;
      },
      removeItem(k: string) {
        delete this.data[k];
      },
    };
    storage.data["vueuse-color-scheme"] = "light";
    migrateColorModeStorage(storage as Storage);
    expect(readStoredColorPreference(storage as Storage)).toBe("light");
    expect(storage.data["hub-color-mode"]).toBe(serializeColorPreference("light"));
  });
});
