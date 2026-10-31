import { extractAuthUserId } from "~/shared/lib/auth-user-id";

/**
 * @nuxtjs/supabase v2 stores JWT claims in useSupabaseUser(), not User.
 * The subject id lives on `sub`; session.user.id is the reliable fallback.
 */
export function useAuthUserId(): ComputedRef<string | null> {
  const claims = useSupabaseUser();
  const session = useSupabaseSession();

  return computed(() => extractAuthUserId(claims.value, session.value?.user?.id ?? null));
}

export function useAuthUserEmail(): ComputedRef<string | null> {
  const session = useSupabaseSession();
  const claims = useSupabaseUser();
  return computed(() => {
    return (
      session.value?.user?.email ??
      (typeof (claims.value as { email?: string } | null)?.email === "string"
        ? (claims.value as { email: string }).email
        : null)
    );
  });
}

export async function waitForAuthUserId(timeoutMs = 8000): Promise<string | null> {
  if (import.meta.server) return null;

  const authUserId = useAuthUserId();
  if (authUserId.value) return authUserId.value;

  await restoreClientSession();
  if (authUserId.value) return authUserId.value;

  return new Promise((resolve) => {
    const stop = watch(authUserId, (id) => {
      if (id) {
        stop();
        clearTimeout(timer);
        resolve(id);
      }
    });
    const timer = window.setTimeout(() => {
      stop();
      resolve(authUserId.value);
    }, timeoutMs);
  });
}
