/**
 * Hosts whose article pages are worth a Firecrawl credit.
 *
 * Collectors (RSS / API / HTML lists) stay on cheap GETs. Firecrawl is spent
 * only when we enrich a ranked item whose URL lives on one of these vendors —
 * the pages that are JS-heavy and actually change a developer's setup.
 *
 * github.com is intentionally absent: repos go through the GitHub API,
 * release notes already arrive in Atom.
 */
export const ESSENTIAL_AI_INTEL_HOSTS = [
  "openai.com",
  "anthropic.com",
  "cursor.com",
  "github.blog",
  "simonwillison.net",
  "blog.google",
  "deepmind.google",
  "huggingface.co",
  "vercel.com",
  "vercel-status.com",
  "ollama.com",
  "nvidia.com",
] as const;

export function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export function isEssentialAiIntelUrl(url: string): boolean {
  const host = hostnameOf(url);
  if (!host) return false;
  return ESSENTIAL_AI_INTEL_HOSTS.some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`),
  );
}
