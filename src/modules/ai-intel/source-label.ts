const SOURCE_LABELS: Record<string, string> = {
  gittrend: "GitHub",
  futuretools: "Future Tools",
  "github-trending": "GitHub",
  "hn-ai": "Hacker News",
  "openai-blog": "OpenAI",
  "anthropic-news": "Anthropic",
  "google-ai-blog": "Google",
  "meta-ai-blog": "Meta",
  "huggingface-blog": "Hugging Face",
  "vercel-blog": "Vercel",
  "github-blog": "GitHub",
  "tldr-ai": "TLDR",
  "gnews-ai-policy": "Actualité",
  "gnews-ai-models": "Actualité",
  "producthunt-ai": "Product Hunt",
};

const SKIP_PARTS = new Set(["ai", "rss", "html", "api", "feed"]);

/** Human name for a source id. Never show collector slugs like `hn-ai`. */
export function sourceDisplayName(sourceId: string | null | undefined): string {
  const id = (sourceId ?? "").trim();
  if (!id) return "";
  if (SOURCE_LABELS[id]) return SOURCE_LABELS[id];
  const words = id
    .split(/[-_]/)
    .filter((part) => part && !SKIP_PARTS.has(part.toLowerCase()))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());
  return words.join(" ") || id;
}
