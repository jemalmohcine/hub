"use client";

import { useActionState } from "react";
import {
  mockUpgradePlan,
  updatePreferences,
  updateProfile,
  type ActionResult,
} from "@/core/auth/actions";
import { Button, Input, Label } from "@/shared/ui";
import type { HubUser } from "@/core/auth/types";
import { PLAN_META } from "@/core/entitlements";

function ResultBanner({ state }: { state: ActionResult | null }) {
  if (!state) return null;
  if (state.ok) {
    return (
      <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-success">
        Enregistré.
      </p>
    );
  }
  return (
    <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
      {state.error}
    </p>
  );
}

export function ProfileForm({ user }: { user: HubUser }) {
  const [state, action, pending] = useActionState(updateProfile, null);

  return (
    <form action={action} className="space-y-4">
      <ResultBanner state={state} />
      <div>
        <Label htmlFor="display_name">Nom affiché</Label>
        <Input
          id="display_name"
          name="display_name"
          defaultValue={user.profile.display_name ?? ""}
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={user.email} disabled />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}

export function PreferencesForm({ user }: { user: HubUser }) {
  const [state, action, pending] = useActionState(updatePreferences, null);
  const prefs = user.preferences;

  return (
    <form action={action} className="space-y-4">
      <ResultBanner state={state} />
      <div>
        <Label htmlFor="theme">Thème</Label>
        <select
          id="theme"
          name="theme"
          defaultValue={prefs?.theme ?? "system"}
          className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm"
        >
          <option value="system">Système</option>
          <option value="light">Clair</option>
          <option value="dark">Sombre</option>
        </select>
      </div>
      <div>
        <Label htmlFor="locale">Langue</Label>
        <select
          id="locale"
          name="locale"
          defaultValue={prefs?.locale ?? "fr"}
          className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm"
        >
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
      </div>
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="email_notifications"
          defaultChecked={prefs?.email_notifications ?? true}
          className="h-4 w-4 rounded border-border"
        />
        Notifications email
      </label>
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="product_updates"
          defaultChecked={prefs?.product_updates ?? true}
          className="h-4 w-4 rounded border-border"
        />
        Product updates
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer les préférences"}
      </Button>
    </form>
  );
}

export function BillingForm({ user }: { user: HubUser }) {
  const [state, action, pending] = useActionState(mockUpgradePlan, null);
  const plan = user.subscription?.plan ?? "free";

  return (
    <div className="space-y-4">
      <ResultBanner state={state} />
      <div className="grid gap-3 sm:grid-cols-2">
        {(["free", "pro"] as const).map((id) => {
          const meta = PLAN_META[id];
          const active = plan === id;
          return (
            <div
              key={id}
              className={`rounded-2xl border p-4 ${
                active ? "border-accent bg-accent-soft/40" : "border-border"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-semibold">{meta.label}</h3>
                <span className="font-mono text-sm text-muted">
                  {meta.priceLabel}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">{meta.description}</p>
              {active ? (
                <p className="mt-4 text-sm font-medium text-accent">Plan actuel</p>
              ) : (
                <form action={action} className="mt-4">
                  <input type="hidden" name="plan" value={id} />
                  <Button type="submit" variant="secondary" disabled={pending}>
                    {pending
                      ? "…"
                      : id === "pro"
                        ? "Activer Pro (mock)"
                        : "Repasser Free (mock)"}
                  </Button>
                </form>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted">
        Paiement abstrait — aucun Stripe branché. Le mock met à jour ta
        subscription Supabase pour tester les entitlements. Remplace{" "}
        <code className="font-mono">MockPaymentProvider</code> quand tu choisis
        un PSP.
      </p>
    </div>
  );
}
