import { describe, expect, it } from "vitest";
import {
  normalizeLocale,
  normalizeLocalePreference,
  resolveLocale,
} from "@/core/i18n/locale";

describe("normalizeLocale", () => {
  it("defaults to French", () => {
    expect(normalizeLocale(null)).toBe("fr");
    expect(normalizeLocale("de")).toBe("fr");
  });

  it("detects English variants", () => {
    expect(normalizeLocale("en-GB")).toBe("en");
  });
});

describe("normalizeLocalePreference", () => {
  it("keeps explicit choices and falls back to auto", () => {
    expect(normalizeLocalePreference("fr")).toBe("fr");
    expect(normalizeLocalePreference("en-US")).toBe("en");
    expect(normalizeLocalePreference("auto")).toBe("auto");
    expect(normalizeLocalePreference("es")).toBe("auto");
  });
});

describe("resolveLocale", () => {
  it("lets an explicit setting win over the browser", () => {
    expect(resolveLocale("fr", "en-US,en;q=0.9")).toBe("fr");
    expect(resolveLocale("en", "fr-FR")).toBe("en");
  });

  it("reads Accept-Language when the setting is auto", () => {
    expect(resolveLocale("auto", "en-US,en;q=0.9")).toBe("en");
    expect(resolveLocale("auto", "fr-FR,fr;q=0.9")).toBe("fr");
  });

  it("skips unsupported languages before matching", () => {
    expect(resolveLocale("auto", "de-DE,de;q=0.9,en;q=0.7")).toBe("en");
  });

  it("defaults to French with no hints at all", () => {
    expect(resolveLocale(null, null)).toBe("fr");
  });
});
