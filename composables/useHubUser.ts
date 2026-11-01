import type { HubUser, Profile, Subscription, UserPreferences } from "~/shared/core/auth/types";
import { entitlementsForPlan } from "~/shared/core/entitlements";

export function useHubUser() {
  const client = useSupabaseClient();
  const authUser = useSupabaseUser();
  const authUserId = useAuthUserId();

  const { data: hubUser, pending, refresh } = useAsyncData(
    () => `hub-user-${authUserId.value ?? "anon"}`,
    async (): Promise<HubUser | null> => {
      await ensureAuthUserId();
      const userId = authUserId.value;
      const user = authUser.value;
      if (!userId || !user) return null;

      const [{ data: profile }, { data: subscription }, { data: preferences }] =
        await Promise.all([
          client.from("profiles").select("*").eq("id", userId).maybeSingle(),
          client.from("subscriptions").select("*").eq("user_id", userId).maybeSingle(),
          client.from("user_preferences").select("*").eq("user_id", userId).maybeSingle(),
        ]);

      const fallbackProfile: Profile = {
        id: userId,
        email: user.email ?? "",
        first_name: (user.user_metadata?.first_name as string | null) ?? null,
        last_name: (user.user_metadata?.last_name as string | null) ?? null,
        display_name: (user.user_metadata?.display_name as string | null) ?? null,
        avatar_url: (user.user_metadata?.avatar_url as string | null) ?? null,
        role: "user",
        created_at: user.created_at,
        updated_at: user.created_at,
      };

      const resolvedProfile = (profile as Profile | null) ?? fallbackProfile;
      const resolvedSub = subscription as Subscription | null;
      const plan = resolvedSub?.plan ?? "free";

      return {
        id: userId,
        email: user.email ?? resolvedProfile.email,
        profile: resolvedProfile,
        subscription: resolvedSub,
        preferences: preferences as UserPreferences | null,
        entitlements: entitlementsForPlan(plan),
      };
    },
    { watch: [() => authUserId.value], server: false },
  );

  return { hubUser, pending, refresh };
}
