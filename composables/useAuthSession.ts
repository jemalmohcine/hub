/** Wait for Supabase session from cookies before treating the user as logged out (iOS PWA). */
export async function restoreClientSession(): Promise<boolean> {
  if (import.meta.server) return false;

  const client = useSupabaseClient();
  const user = useSupabaseUser();
  const session = useSupabaseSession();

  if (user.value) return true;

  const { data: sessionData, error } = await client.auth.getSession();
  if (error || !sessionData.session) return false;

  session.value = sessionData.session;
  const sessionUser = sessionData.session.user;
  if (sessionUser?.id) {
    user.value = sessionUser;
    return true;
  }

  const { data: claimsData } = await client.auth.getClaims();
  const claims = claimsData?.claims as { sub?: string; email?: string } | undefined;
  const sub = claims?.sub;
  if (!sub) return false;

  user.value = {
    ...claims,
    id: sub,
    email: claims?.email,
  } as typeof user.value;
  return true;
}

export function useRestoreSessionOnMount() {
  onMounted(() => {
    void restoreClientSession();
  });
}
