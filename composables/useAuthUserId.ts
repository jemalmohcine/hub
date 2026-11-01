import { resolveAuthUserId } from "~/shared/lib/auth-user-id";

/** Supabase user id: session user has `id`, JWT claims use `sub`. */
export { resolveAuthUserId };

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
