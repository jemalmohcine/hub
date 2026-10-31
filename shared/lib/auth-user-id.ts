/** Pure helper (testable): resolve user id from @nuxtjs/supabase JWT claims or session. */
export function extractAuthUserId(
  claims: unknown,
  sessionUserId?: string | null,
): string | null {
  const raw = claims as Record<string, unknown> | null;
  if (raw?.sub && typeof raw.sub === "string") return raw.sub;
  if (raw?.id && typeof raw.id === "string") return raw.id;
  return sessionUserId ?? null;
}
