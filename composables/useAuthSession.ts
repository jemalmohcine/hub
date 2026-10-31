import { extractAuthUserId } from "~/shared/lib/auth-user-id";

/**
 * Hydrate session + user from auth cookies (SSR full reload and client boot).
 * @nuxtjs/supabase strips session.user on the server; getSession() restores it.
 */
export async function syncSupabaseAuthState(): Promise<boolean> {
  const client = useSupabaseClient();
  const sessionRef = useSupabaseSession();
  const userRef = useSupabaseUser();

  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError || !sessionData.session) {
    return false;
  }

  sessionRef.value = sessionData.session;

  const { data: claimsData, error: claimsError } = await client.auth.getClaims();
  if (!claimsError && claimsData?.claims) {
    userRef.value = claimsData.claims;
  } else if (sessionData.session.user) {
    userRef.value = sessionData.session.user;
  }

  return Boolean(
    extractAuthUserId(
      userRef.value,
      sessionData.session.user?.id ?? null,
      sessionData.session.access_token,
    ),
  );
}

/** Wait for Supabase session from cookies before treating the user as logged out (iOS PWA). */
export async function restoreClientSession(): Promise<boolean> {
  if (import.meta.server) return syncSupabaseAuthState();
  return syncSupabaseAuthState();
}

export function useRestoreSessionOnMount() {
  onMounted(() => {
    void restoreClientSession();
  });
}

function requestHasAuthCookie(): boolean {
  if (import.meta.server) {
    const event = useRequestEvent();
    if (!event) return false;
    const cookie = getHeader(event, "cookie") ?? "";
    const prefix = useRuntimeConfig().public.supabase.cookiePrefix as string;
    return cookie.includes(prefix) || cookie.includes("auth-token");
  }
  return document.cookie.includes("auth-token");
}

/** True when the browser likely has a session but state is not hydrated yet. */
export function likelyAuthenticatedButPending(): boolean {
  if (useAuthUserId().value) return false;
  return requestHasAuthCookie();
}
