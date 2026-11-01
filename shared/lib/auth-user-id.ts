/** Supabase user id: session user has `id`, JWT claims use `sub`. */
export function resolveAuthUserId(
  user: { id?: string; sub?: string } | null | undefined,
): string | null {
  if (!user) return null;
  return user.id ?? user.sub ?? null;
}
