export const SITE_NAME = "hub";

export const SITE_TAGLINE =
  "Veille IA, snippets, CV et budget outils pour développeurs.";

export const SITE_DESCRIPTION =
  "hub regroupe votre quotidien technique : actualités IA, bibliothèque de code, CV exportable et suivi des dépenses outils.";

const FALLBACK_ORIGIN = "http://localhost:3000";

/** Canonical public origin, without a trailing slash. */
export function siteOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NUXT_PUBLIC_APP_URL?.trim() ||
    FALLBACK_ORIGIN;
  try {
    return new URL(raw).origin;
  } catch {
    return FALLBACK_ORIGIN;
  }
}

export function absoluteUrl(path = "/"): string {
  const origin = siteOrigin();
  if (!path || path === "/") return `${origin}/`;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
