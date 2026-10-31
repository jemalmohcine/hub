/** Pure helper (testable): resolve user id from @nuxtjs/supabase JWT claims or session. */
export function subFromJwt(accessToken: string | null | undefined): string | null {
  if (!accessToken) return null;
  const part = accessToken.split(".")[1];
  if (!part) return null;
  try {
    const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const json =
      typeof Buffer !== "undefined"
        ? Buffer.from(padded, "base64").toString("utf8")
        : atob(padded);
    const payload = JSON.parse(json) as { sub?: string };
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export function extractAuthUserId(
  claims: unknown,
  sessionUserId?: string | null,
  accessToken?: string | null,
): string | null {
  const raw = claims as Record<string, unknown> | null;
  if (raw?.sub && typeof raw.sub === "string") return raw.sub;
  if (raw?.id && typeof raw.id === "string") return raw.id;
  if (sessionUserId) return sessionUserId;
  return subFromJwt(accessToken);
}
