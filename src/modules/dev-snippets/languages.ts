export const SNIPPET_LANGUAGES = [
  "typescript",
  "javascript",
  "python",
  "bash",
  "sql",
  "html",
  "css",
  "json",
  "yaml",
  "docker",
  "go",
  "rust",
  "java",
  "php",
  "markdown",
  "other",
] as const;

export type SnippetLanguage = (typeof SNIPPET_LANGUAGES)[number];

export function suggestProviderForLanguage(language: string | null): "mdn" | "npm" | "devdocs" {
  const lang = (language ?? "").toLowerCase();
  if (lang === "typescript" || lang === "javascript") return "mdn";
  if (lang === "bash" || lang === "docker" || lang === "yaml") return "devdocs";
  return "devdocs";
}
