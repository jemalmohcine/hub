"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/core/auth/supabase/server";
import { getHubUser } from "@/core/auth/get-user";
import { getPaymentProvider } from "@/core/billing";
import type { PlanId, ThemePreference } from "@/core/auth/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function signInWithPassword(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/app/overview");

  if (!email || !password) {
    return { ok: false, error: "Email et mot de passe requis." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { ok: false, error: error.message };
  }

  redirect(next.startsWith("/") ? next : "/app/overview");
}

export async function signUpWithPassword(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();

  if (!email || !password) {
    return { ok: false, error: "Email et mot de passe requis." };
  }
  if (password.length < 8) {
    return { ok: false, error: "Le mot de passe doit faire au moins 8 caractères." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName || undefined },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  redirect("/app/overview");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}

export async function updateProfile(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getHubUser();
  if (!user) return { ok: false, error: "Non authentifié." };

  const displayName = String(formData.get("display_name") ?? "").trim();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName || null })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/settings");
  return { ok: true };
}

export async function updatePreferences(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getHubUser();
  if (!user) return { ok: false, error: "Non authentifié." };

  const theme = String(formData.get("theme") ?? "system") as ThemePreference;
  const locale = String(formData.get("locale") ?? "fr");
  const emailNotifications = formData.get("email_notifications") === "on";
  const productUpdates = formData.get("product_updates") === "on";

  const supabase = await createClient();
  const { error } = await supabase.from("user_preferences").upsert({
    user_id: user.id,
    theme,
    locale,
    email_notifications: emailNotifications,
    product_updates: productUpdates,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/settings");
  return { ok: true };
}

export async function mockUpgradePlan(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  if (process.env.NEXT_PUBLIC_BILLING_MOCK !== "true") {
    return {
      ok: false,
      error: "Mock billing désactivé. Branchez un PaymentProvider réel.",
    };
  }

  const user = await getHubUser();
  if (!user) return { ok: false, error: "Non authentifié." };

  const plan = String(formData.get("plan") ?? "pro") as PlanId;
  if (plan !== "free" && plan !== "pro") {
    return { ok: false, error: "Plan invalide." };
  }

  const provider = getPaymentProvider();
  await provider.createCheckout(user.id, plan);

  const supabase = await createClient();
  const periodEnd =
    plan === "pro"
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;

  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: user.id,
      plan,
      status: "active",
      provider: provider.id,
      current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app");
  revalidatePath("/app/settings/billing");
  revalidatePath("/app/settings/modules");
  return { ok: true };
}

export async function toggleModuleFlag(
  moduleId: string,
  enabled: boolean,
): Promise<ActionResult> {
  const user = await getHubUser();
  if (!user || user.profile.role !== "admin") {
    return { ok: false, error: "Accès admin requis." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("module_flags")
    .upsert({ module_id: moduleId, enabled, updated_at: new Date().toISOString() });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  revalidatePath("/app");
  return { ok: true };
}
