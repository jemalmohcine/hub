import type { WebSearchProvider } from "@/modules/dev-snippets/types";
import { suggestProviderForLanguage } from "@/modules/dev-snippets/languages";

export function buildWebSearchUrl(provider: WebSearchProvider, query: string): string {
  const q = encodeURIComponent(query.trim());
  if (!q) return "#";

  switch (provider) {
    case "google":
      return `https://www.google.com/search?q=${q}`;
    case "mdn":
      return `https://developer.mozilla.org/fr/search?q=${q}`;
    case "stackoverflow":
      return `https://stackoverflow.com/search?q=${q}`;
    case "devdocs":
      return `https://devdocs.io/#q=${q}`;
    case "npm":
      return `https://www.npmjs.com/search?q=${q}`;
    case "github":
      return `https://github.com/search?q=${q}&type=code`;
    default:
      return `https://www.google.com/search?q=${q}`;
  }
}

export function buildSmartSearchQuery(
  title: string,
  content: string,
  language: string | null,
): string {
  const titlePart = title.trim();
  const contentLine =
    content
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? "";

  if (language && language !== "other" && language !== "markdown") {
    return [titlePart, language, contentLine.slice(0, 80)]
      .filter(Boolean)
      .join(" ")
      .trim();
  }

  return titlePart || contentLine.slice(0, 120);
}

export function preferredProviders(language: string | null): WebSearchProvider[] {
  const primary = suggestProviderForLanguage(language);
  const base: WebSearchProvider[] = [primary, "stackoverflow", "google"];
  if (primary !== "devdocs") base.splice(1, 0, "devdocs");
  if (language === "typescript" || language === "javascript") base.unshift("npm");
  return [...new Set(base)];
}
