/** Supabase user id: session user has `id`, JWT claims use `sub`. */
export function resolveAuthUserId(
  user: { id?: string; sub?: string } | null | undefined,
): string | null {
  if (!user) return null;
  return user.id ?? user.sub ?? null;
}

export function useAuthUserId() {
  const user = useSupabaseUser();
  return computed(() => resolveAuthUserId(user.value as { id?: string; sub?: string } | null));
}

/** Call inside client data loaders when session may still be hydrating. */
export async function ensureAuthUserId(): Promise<string | null> {
  const id = useAuthUserId();
  if (id.value) return id.value;
  await restoreClientSession();
  return id.value;
}
