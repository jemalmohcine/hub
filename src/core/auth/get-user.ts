import { createClient } from "@/core/auth/supabase/server";
import { entitlementsForPlan } from "@/core/entitlements";
import type {
  HubUser,
  Profile,
  Subscription,
  UserPreferences,
} from "@/core/auth/types";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getHubUser(): Promise<HubUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: profile }, { data: subscription }, { data: preferences }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  const fallbackProfile: Profile = {
    id: user.id,
    email: user.email ?? "",
    display_name: user.user_metadata?.display_name ?? null,
    avatar_url: user.user_metadata?.avatar_url ?? null,
    role: "user",
    created_at: user.created_at,
    updated_at: user.created_at,
  };

  const resolvedProfile = (profile as Profile | null) ?? fallbackProfile;
  const resolvedSub = subscription as Subscription | null;
  const plan = resolvedSub?.plan ?? "free";

  return {
    id: user.id,
    email: user.email ?? resolvedProfile.email,
    profile: resolvedProfile,
    subscription: resolvedSub,
    preferences: preferences as UserPreferences | null,
    entitlements: entitlementsForPlan(plan),
  };
}

export async function requireHubUser(): Promise<HubUser> {
  const hubUser = await getHubUser();
  if (!hubUser) {
    throw new Error("Unauthorized");
  }
  return hubUser;
}

export async function requireAdmin(): Promise<HubUser> {
  const hubUser = await requireHubUser();
  if (hubUser.profile.role !== "admin") {
    throw new Error("Forbidden");
  }
  return hubUser;
}
