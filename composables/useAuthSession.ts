/** Wait for Supabase session from cookies before treating the user as logged out (iOS PWA). */
export async function restoreClientSession(): Promise<boolean> {
  if (import.meta.server) return false;

  const client = useSupabaseClient();
  const user = useSupabaseUser();
  const session = useSupabaseSession();

  const authUserId = useAuthUserId();
  if (authUserId.value) return true;

  const { data: sessionData, error } = await client.auth.getSession();
  if (error || !sessionData.session) return false;

  session.value = sessionData.session;
  const { data: claimsData } = await client.auth.getClaims();
  user.value = claimsData?.claims ?? sessionData.session.user ?? null;
  return Boolean(useAuthUserId().value);
}

export function useRestoreSessionOnMount() {
  onMounted(() => {
    void restoreClientSession();
  });
}
