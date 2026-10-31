export type UserRole = "user" | "admin";
export type PlanId = "free" | "pro";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing";
export type ThemePreference = "light" | "dark" | "system";
export type ModuleStatus = "active" | "coming_soon" | "disabled";

export type Profile = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export function profileFullName(profile: Pick<Profile, "first_name" | "last_name" | "display_name">) {
  const composed = [profile.first_name, profile.last_name]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  return composed || profile.display_name?.trim() || null;
}

export type UserPreferences = {
  user_id: string;
  theme: ThemePreference;
  locale: string;
  email_notifications: boolean;
  product_updates: boolean;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan: PlanId;
  status: SubscriptionStatus;
  current_period_end: string | null;
  provider: string | null;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
};

export type HubUser = {
  id: string;
  email: string;
  profile: Profile;
  subscription: Subscription | null;
  preferences: UserPreferences | null;
  entitlements: string[];
};
