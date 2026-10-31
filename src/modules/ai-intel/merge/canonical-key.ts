/** Build a stable key so the same news from many sites becomes one item. */

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "ref",
  "fbclid",
  "gclid",
]);

export function stripTrackingParams(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    for (const key of [...u.searchParams.keys()]) {
      if (TRACKING_PARAMS.has(key.toLowerCase())) u.searchParams.delete(key);
    }
    u.hash = "";
    return u.toString();
  } catch {
    return rawUrl.trim();
  }
}

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s/\-_.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extract owner/repo style tokens from title/url. */
export function extractRepoSlug(text: string): string | null {
  const fromUrl = text.match(/github\.com\/([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)/i);
  if (fromUrl) return fromUrl[1].toLowerCase().replace(/\.git$/, "");
  const fromTitle = text.match(/\b([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)\b/);
  if (fromTitle && !fromTitle[1].includes("http")) {
    return fromTitle[1].toLowerCase();
  }
  return null;
}

/** Model-ish names: Claude Opus 5, GPT-5.6, Gemini 2.5, etc. */
export function extractModelToken(text: string): string | null {
  const patterns = [
    /\b(claude\s+(?:opus|sonnet|haiku)\s*[\w.]*)\b/i,
    /\b(gpt[-\s]?\d+(?:\.\d+)?(?:\s*(?:mini|nano|pro|turbo))?)\b/i,
    /\b(gemini\s*[\w.]+)\b/i,
    /\b(llama\s*[\w.]+)\b/i,
    /\b(mistral\s*[\w.]+)\b/i,
    /\b(deepseek\s*[\w.]+)\b/i,
    /\b(grok\s*[\w.]+)\b/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return normalizeTitle(m[1]);
  }
  return null;
}

export function buildCanonicalKey(input: {
  title: string;
  url: string;
  summary?: string;
}): string {
  const blob = `${input.title} ${input.summary ?? ""} ${input.url}`;
  const repo = extractRepoSlug(blob);
  if (repo) return `repo:${repo}`;

  const model = extractModelToken(blob);
  if (model) {
    const action =
      /deprecat|sunset|retir/i.test(blob)
        ? "deprecation"
        : /pric|cost|\$|€/i.test(blob)
          ? "pricing"
          : /ban|regulat|policy|eu ai act/i.test(blob)
            ? "policy"
            : "release";
    return `model:${model}:${action}`;
  }

  const titleKey = normalizeTitle(input.title)
    .split(" ")
    .filter((w) => w.length > 2)
    .slice(0, 10)
    .join("-");

  if (titleKey.length >= 12) return `title:${titleKey}`;

  return `url:${stripTrackingParams(input.url)}`;
}
