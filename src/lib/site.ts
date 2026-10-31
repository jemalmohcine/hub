export const SITE_NAME = "DevHub";

export const SITE_TAGLINE =
  "Le hub développeur : veille IA, CV, candidatures, snippets et budget outils.";

export const SITE_DESCRIPTION =
  "DevHub rassemble tes outils de développeur : actualités IA, CV, offres d’emploi, snippets et budget des services. Connexion Google, GitHub ou email.";

const FALLBACK_ORIGIN = "http://localhost:3000";

/** Canonical public origin, without a trailing slash. */
export function siteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() || FALLBACK_ORIGIN;
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
