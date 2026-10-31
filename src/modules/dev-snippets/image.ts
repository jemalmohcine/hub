/** Max length of the stored string (https URL or compressed data URL). */
export const SNIPPET_IMAGE_MAX_CHARS = 700_000;
export const SNIPPET_IMAGE_URL_MAX_CHARS = 2_048;

const DATA_URL_PREFIX = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/i;
const BASE64_BODY = /^[A-Za-z0-9+/]+=*$/;

export function normalizeSnippetImage(
  value: string | null | undefined,
): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    if (trimmed.length > SNIPPET_IMAGE_URL_MAX_CHARS) {
      throw new Error("Le lien de l’image est trop long.");
    }
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      throw new Error("Le lien de l’image n’est pas valide.");
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("Le lien de l’image n’est pas valide.");
    }
    return trimmed;
  }

  const prefix = DATA_URL_PREFIX.exec(trimmed);
  if (!prefix) {
    throw new Error("Joins une image (JPEG, PNG, GIF ou WebP) ou un lien https.");
  }
  if (trimmed.length > SNIPPET_IMAGE_MAX_CHARS) {
    throw new Error("L’image est trop lourde (max ~500 Ko).");
  }
  const body = trimmed.slice(prefix[0].length);
  if (!body || !BASE64_BODY.test(body)) {
    throw new Error("L’image n’est pas valide.");
  }
  return trimmed;
}
